import azure.functions as func
import logging
import logging
import os
import pandas as pd
import inspect
import tiktoken
import yaml
import environs
from azure.identity.aio import DefaultAzureCredential
from azure.storage.blob.aio import BlobServiceClient as BlobServiceClientAsync
from environs import Env
from dotenv import load_dotenv
from graphrag.query.structured_search.global_search.community_context import (
    GlobalCommunityContext,
)
from graphrag.query.structured_search.global_search.search import GlobalSearch
from graphrag.query.indexer_adapters import read_indexer_entities, read_indexer_reports
from graphrag.config import create_graphrag_config
from graphrag.query.llm.oai.typing import OpenaiApiType
from graphrag.query.llm.oai.chat_openai import ChatOpenAI


# Load environment variables from a .env file
load_dotenv()

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

class BlobServiceClientSingletonAsync:
    _instance = None
    _env = Env()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            account_url = os.environ.get("STORAGE_ACCOUNT_BLOB_URL")
            credential = DefaultAzureCredential()
            cls._instance = BlobServiceClientAsync(account_url, credential=credential)
        return cls._instance

    @classmethod
    def get_storage_account_name(cls):
        account_url = os.environ.get("STORAGE_ACCOUNT_BLOB_URL")
        return account_url.split("//")[1].split(".")[0]

def get_df(table_path: str) -> pd.DataFrame:
    logging.info("reading data from storage")

    storage_options = {
        "account_name": BlobServiceClientSingletonAsync.get_storage_account_name(),
        "account_host": BlobServiceClientSingletonAsync.get_instance().url.split("//")[1],
        "credential": DefaultAzureCredential()
    }
    logging.info("attempt to read parquet from account")
    df = pd.read_parquet(table_path, storage_options=storage_options)
    logging.info("successfully read parquet files")
    return df


def read_data():

    logging.info("start reading parquet files")
    
    index_name = os.environ.get("INDEX_NAME") # 'output'

    COMMUNITY_REPORT_TABLE = os.environ.get("COMMUNITY_REPORT_TABLE") # "output/create_final_community_reports.parquet"
    ENTITIES_TABLE = os.environ.get("ENTITIES_TABLE") # "output/create_final_entities.parquet"
    NODES_TABLE = os.environ.get("NODES_TABLE") # "output/create_final_nodes.parquet"
    
    # table paths
    community_report_table_path = (
        f"abfs://{index_name}/{COMMUNITY_REPORT_TABLE}"
    )
    entities_table_path = f"abfs://{index_name}/{ENTITIES_TABLE}"
    nodes_table_path = f"abfs://{index_name}/{NODES_TABLE}"

    links = {
        "nodes": {},
        "community": {},
        "entities": {},
        "text_units": {},
        "relationships": {},
        "covariates": {},
    }
    max_vals = {
        "nodes": -1,
        "community": -1,
        "entities": -1,
        "text_units": -1,
        "relationships": -1,
        "covariates": -1,
    }

    community_dfs = []
    entities_dfs = []
    nodes_dfs = []
    
    # note that nodes need to set before communities to that max community id makes sense
    # nodes
    nodes_df = get_df(nodes_table_path)
    for i in nodes_df["human_readable_id"]:
        links["nodes"][i + max_vals["nodes"] + 1] = {
            "index_name": index_name,
            "id": i,
        }
    if max_vals["nodes"] != -1:
        nodes_df["human_readable_id"] += max_vals["nodes"] + 1
    nodes_df["community"] = nodes_df["community"].apply(
        lambda x: str(int(x) + max_vals["community"] + 1) if x else x
    )
    nodes_df["title"] = nodes_df["title"].apply(lambda x: x + f"-{index_name}")
    nodes_df["source_id"] = nodes_df["source_id"].apply(
        lambda x: ",".join([i + f"-{index_name}" for i in x.split(",")])
    )
    max_vals["nodes"] = nodes_df["human_readable_id"].max()
    nodes_dfs.append(nodes_df)
    
    # community
    community_df = get_df(community_report_table_path)
    for i in community_df["community"].astype(int):
        links["community"][i + max_vals["community"] + 1] = {
            "index_name": index_name,
            "id": str(i),
        }
    if max_vals["community"] != -1:
        col = community_df["community"].astype(int) + max_vals["community"] + 1
        community_df["community"] = col.astype(str)
    max_vals["community"] = community_df["community"].astype(int).max()
    community_dfs.append(community_df)

    # entities
    entities_df = get_df(entities_table_path)
    for i in entities_df["human_readable_id"]:
        links["entities"][i + max_vals["entities"] + 1] = {
            "index_name": index_name,
            "id": i,
        }
    if max_vals["entities"] != -1:
        entities_df["human_readable_id"] += max_vals["entities"] + 1
    entities_df["name"] = entities_df["name"].apply(
        lambda x: x + f"-{index_name}"
    )
    entities_df["text_unit_ids"] = entities_df["text_unit_ids"].apply(
        lambda x: [i + f"-{index_name}" for i in x]
    )
    max_vals["entities"] = entities_df["human_readable_id"].max()
    entities_dfs.append(entities_df)

    # merge dataframes
    nodes_combined = pd.concat(nodes_dfs, axis=0, ignore_index=True, sort=False)
    community_combined = pd.concat(
        community_dfs, axis=0, ignore_index=True, sort=False
    )
    entities_combined = pd.concat(
        entities_dfs, axis=0, ignore_index=True, sort=False
    )
    
    return community_combined, entities_combined, nodes_combined, links


@app.route(route="globalquery", auth_level=func.AuthLevel.FUNCTION)
async def globalquery(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    query = req.params.get('query')
    if not query:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            query = req_body.get('query')

    if query != None:
    
        # load custom pipeline settings
        this_directory = os.path.dirname(
            os.path.abspath(inspect.getfile(inspect.currentframe()))
        )
        
        # get settings
        settings = yaml.safe_load(open(f"{this_directory}/pipeline-settings.yaml"))

        # get parameters
        parameters = create_graphrag_config(settings, ".")
        
        api_key = parameters.llm.api_key
        model = parameters.llm.model
        api_version = parameters.llm.api_version
        api_base = parameters.llm.api_base
        max_retries = parameters.llm.max_retries
        
        llm = ChatOpenAI(
            api_key=api_key,
            model=model,
            api_type=OpenaiApiType.AzureOpenAI,  # OpenaiApiType.OpenAI or OpenaiApiType.AzureOpenAI
            max_retries=max_retries,
            api_base=api_base,
            api_version=api_version
        )
        token_encoder = tiktoken.get_encoding("cl100k_base")
        
        # parquet files generated from indexing pipeline
        INPUT_DIR = "./inputs"
        COMMUNITY_REPORT_TABLE = "create_final_community_reports"
        ENTITY_TABLE = "create_final_nodes"
        ENTITY_EMBEDDING_TABLE = "create_final_entities"

        # community level in the Leiden community hierarchy from which we will load the community reports
        # higher value means we use reports from more fine-grained communities (at the cost of higher computation cost)
        COMMUNITY_LEVEL = int(os.environ.get("COMMUNITY_LEVEL"),0)
        
        # COMMUNITY_LEVEL = 1
        
        # read data and combine data
        community_combined, entities_combined, nodes_combined, links = read_data()
        logging.info("read parquet files")
        
        logging.info("process dataframes")
        # Proceed with processing the DataFrames
        if nodes_combined is not None and community_combined is not None and entities_combined is not None:
            reports = read_indexer_reports(community_combined, nodes_combined, COMMUNITY_LEVEL)
            entities = read_indexer_entities(nodes_combined, entities_combined, COMMUNITY_LEVEL)
        else:
            print("One or more DataFrames could not be loaded.")
        
        logging.info('processed dataframes')
        
        logging.info("build global community context for query")
        context_builder = GlobalCommunityContext(
            community_reports=reports,
            entities=entities,  # default to None if you don't want to use community weights for ranking
            token_encoder=token_encoder,
        )
        
        logging.info("create context parameters for global query")
        context_builder_params = {
            "use_community_summary": False,  # False means using full community reports. True means using community short summaries.
            "shuffle_data": True,
            "include_community_rank": True,
            "min_community_rank": 0,
            "community_rank_name": "rank",
            "include_community_weight": True,
            "community_weight_name": "occurrence weight",
            "normalize_community_weight": True,
            "max_tokens": 12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
            "context_name": "Reports",
        }
        
        
        map_llm_params = {
        "max_tokens": 1000,
        "temperature": 0.0,
        "response_format": {"type": "json_object"},
    }

        reduce_llm_params = {
            "max_tokens": 2000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 1000-1500)
            "temperature": 0.0,
        }
        
        logging.info("Create Global Search parameters")
        search_engine = GlobalSearch(
            llm=llm,
            context_builder=context_builder,
            token_encoder=token_encoder,
            max_data_tokens=12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
            map_llm_params=map_llm_params,
            reduce_llm_params=reduce_llm_params,
            allow_general_knowledge=False,  # set this to True will add instruction to encourage the LLM to incorporate general knowledge in the response, which may increase hallucinations, but could be useful in some use cases.
            json_mode=True,  # set this to False if your LLM model does not support JSON mode.
            context_builder_params=context_builder_params,
            concurrent_coroutines=32,
            response_type="multiple paragraphs",  # free form text describing the response type and format, can be anything, e.g. prioritized list, single paragraph, multiple paragraphs, multiple-page report
        )
        
        logging.info("perform global search")
        result = await search_engine.asearch(
            query
        )
        
        # stream = search_engine.astream_search(
        #     "What is the major conflict in this story and who are the protagonist and antagonist?"
        # )
        logging.info("Return http response")
        return func.HttpResponse(result.response)
    else:
        logging.info("No query parameter provided")
        return func.HttpResponse(
            "Provide a query string",
            status_code=400
        )