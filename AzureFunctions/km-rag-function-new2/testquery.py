import openai
import pymssql
query = 'top 5 topics by sentiment'

endpoint = 'https://nc1131-openai.openai.azure.com/'
api_key = 'e91ed255973f45a081b8705cd7f7d300'
api_version = '2024-02-15-preview'
deployment = 'gpt-4'

client = openai.AzureOpenAI(
    azure_endpoint=endpoint,
    api_key=api_key,
    api_version="2023-09-01-preview"
)

sql_prompt = f'''A valid T-SQL query to find {query} for tables and columns provided below:
1. Table: processed_data
Columns: ConversationId,EndTime,StartTime,Content,summary,satisfied,sentiment,topic,key_phrases,complaint,mined_topic
2. Table: processed_data_key_phrases
Columns: ConversationId,key_phrase,sentiment
Only return the generated sql query. do not return anything else.''' 
try:

    completion = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": sql_prompt},
        ],
        temperature=0,
    )
    sql_query = completion.choices[0].message.content
    sql_query = sql_query.replace("```sql",'').replace("```",'')
    print(sql_query)

    # connectionString = os.environ.get("SQLDB_CONNECTION_STRING")
    server = 'nc1131-sql-server.database.windows.net'
    database = 'nc1131-sql-db'
    username = 'sqladmin'
    password = 'TestPassword_1234'

    conn = pymssql.connect(server, username, password, database)
    # conn = pyodbc.connect(connectionString)
    cursor = conn.cursor()
    cursor.execute(sql_query)
    answer = ''
    for row in cursor.fetchall():
        answer += str(row)
except Exception as e:
    answer = str(e) # 'Information from database could not be retrieved. Please try again later.'
print(answer)