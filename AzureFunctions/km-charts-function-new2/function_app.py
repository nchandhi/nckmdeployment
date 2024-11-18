import azure.functions as func
import logging
import json
import os
import pymssql
import pandas as pd
# from dotenv import load_dotenv
# load_dotenv()

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# add post methods - filters will come in the body (request.body), if body is not empty, update the where clause in the query
@app.route(route="get_metrics", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_metrics(req: func.HttpRequest) -> func.HttpResponse:
# select distinct mined_topic from processed_data
    # distinct sentiment from processed_data... union all the results
    data_type = req.params.get('data_type')
    if not data_type:
        data_type = 'filters'

    server = os.environ.get("SQLDB_SERVER")
    database = os.environ.get("SQLDB_DATABASE")
    username = os.environ.get("SQLDB_USERNAME")
    password = os.environ.get("SQLDB_PASSWORD")

    conn = pymssql.connect(server, username, password, database)
    cursor = conn.cursor()
    if data_type == 'filters':
        # print(data_type)
        # select distinct mined_topic from processed_data
        # conn = pymssql.connect(server, username, password, database)
        # cursor = conn.cursor()

        sql_stmt = '''select 'Topic' as filter_name, mined_topic as displayValue, mined_topic as key1 from 
        (SELECT distinct mined_topic from processed_data) t 
        union all
        select 'Sentiment' as filter_name, sentiment as displayValue, sentiment as key1 from 
        (SELECT distinct sentiment from processed_data
        union all select 'all' as sentiment) t
        union all 
        select 'Satisfaction' as filter_name, satisfied as displayValue, satisfied as key1 from
        (SELECT distinct satisfied from processed_data) t
        union all
        select 'DateRange' as filter_name, date_range as displayValue, date_range as key1 from 
        (SELECT 'Last 7 days' as date_range 
        union all SELECT 'Last 14 days' as date_range  
        union all SELECT 'Last 90 days' as date_range  
        union all SELECT 'Year to Date' as date_range  
        ) t'''

        cursor.execute(sql_stmt)
        rows = cursor.fetchall()

        column_names = [i[0] for i in cursor.description]
        df = pd.DataFrame(rows, columns=column_names)

        nested_json = (
        df.groupby("filter_name")
        .apply(lambda x: {
            "filter_name": x.name,
            "filter_values": x.drop(columns="filter_name").to_dict(orient="records")
        }).to_list()
        )

        # df_json = nested_json.to_json(orient='records')
        print(nested_json)
        filters_data = nested_json
        #  = [
        #     {
        #         "filter_name": "Topic",
        #         "filter_values": [
        #             {"key": "internet-services", "displayValue": "Internet Services"},
        #             {
        #                 "key": "billing-and-payment",
        #                 "displayValue": "Billing and Payment",
        #             },
        #             {"key": "loyalty-programs", "displayValue": "Loyalty Programs"},
        #             {
        #                 "key": "international-roaming",
        #                 "displayValue": "International Roaming",
        #             },
        #             {"key": "plan-management", "displayValue": "Plan Management"},
        #             {"key": "device-support", "displayValue": "Device Support"},
        #             {
        #                 "key": "network-connectivity",
        #                 "displayValue": "Network Connectivity",
        #             },
        #             {"key": "parental-controls", "displayValue": "Parental Controls"},
        #         ],
        #     },
        #     {
        #         "filter_name": "Sentiment",
        #         "filter_values": [
        #             {"key": "satisfied", "displayValue": "Satisfied"},
        #             {"key": "dissatisfied", "displayValue": "Dissatisfied"},
        #             {"key": "neutral", "displayValue": "Neutral"},
        #             {"key": "all", "displayValue": "All"},
        #         ],
        #     },
        #     {
        #         "filter_name": "DateRange",
        #         "filter_values": [
        #             {"key": "7days", "displayValue": "Last 7 days"},
        #             {"key": "14days", "displayValue": "Last 14 days"},
        #             {"key": "90days", "displayValue": "Last 90 days"},
        #             {"key": "yearToDate", "displayValue": "Year to Date"},
        #         ],
        #     },
        # ]

        json_response = json.dumps(filters_data)
        return func.HttpResponse(json_response, mimetype="application/json", status_code=200)
    # where clauses for the charts data 
    elif data_type == 'charts':
        sql_stmt = '''select 'Total Calls' as id, 'Total Calls' as chart_name, 'card' as chart_type,
        'Total Calls' as name1, count(*) as value1, '' as unit_of_measurement from [dbo].[processed_data]
        union all 
        select 'Average Handling Time' as id, 'Average Handling Time' as chart_name, 'card' as chart_type,
        'Average Handling Time' as name1, 
        AVG(DATEDIFF(MINUTE, StartTime, EndTime))  as value1, 'mins' as unit_of_measurement from [dbo].[processed_data]
        union all 
        select 'Satisfied' as id, 'Satisfied' as chart_name, 'card' as chart_type,
        'Satisfied' as name1, 
        (count(satisfied) * 100 / sum(count(satisfied)) over ()) as value1, '%' as unit_of_measurement from [dbo].[processed_data]
        select 'Total Calls' as id, 'Total Calls' as chart_name, 'card' as chart_type,
        'Total Calls' as name1, count(*) as value1, '' as unit_of_measurement from [dbo].[processed_data]
        union all 
        select 'Average Handling Time' as id, 'Average Handling Time' as chart_name, 'card' as chart_type,
        'Average Handling Time' as name1, 
        AVG(DATEDIFF(MINUTE, StartTime, EndTime))  as value1, 'mins' as unit_of_measurement from [dbo].[processed_data]
        union all 
        select 'Satisfied' as id, 'Satisfied' as chart_name, 'card' as chart_type,
        'Satisfied' as name1, 
        (count(satisfied) * 100 / sum(count(satisfied)) over ()) as value1, '%' as unit_of_measurement from [dbo].[processed_data] 
        where satisfied = 'yes' 
        union all 
        select 'SENTIMENT' as id, 'Topics Overview' as chart_name, 'donutchart' as chart_type, 
        sentiment as name1,
        (count(sentiment) * 100 / sum(count(sentiment)) over ()) as value1, 
        '' as unit_of_measurement from [dbo].[processed_data]  where sentiment = 'positive' group by sentiment
        union all 
        select 'SENTIMENT' as id, 'Topics Overview' as chart_name, 'donutchart' as chart_type, 
        sentiment as name1,
        (count(sentiment) * 100 / sum(count(sentiment)) over ()) as value1, 
        '' as unit_of_measurement from [dbo].[processed_data]  where sentiment = 'negative' group by sentiment
        union all 
        select 'SENTIMENT' as id, 'Topics Overview' as chart_name, 'donutchart' as chart_type, 
        sentiment as name1,
        (count(sentiment) * 100 / sum(count(sentiment)) over ()) as value1, 
        '' as unit_of_measurement from [dbo].[processed_data]  where sentiment = 'neutral' group by sentiment
        union all
        select 'AVG_HANDLING_TIME_BY_TOPIC' as id, 'Average Handling Time By Topic' as chart_name, 'bar' as chart_type,
        mined_topic as name1, 
        AVG(DATEDIFF(MINUTE, StartTime, EndTime)) as value1, '' as unit_of_measurement from [dbo].[processed_data] group by mined_topic
        '''
        #charts pt1
        cursor.execute(sql_stmt)

        rows = cursor.fetchall()

        column_names = [i[0] for i in cursor.description]
        df = pd.DataFrame(rows, columns=column_names)

        # charts pt1
        nested_json1 = (
            df.groupby(['id', 'chart_name', 'chart_type']).apply(lambda x: x[['name1', 'value1', 'unit_of_measurement']].to_dict(orient='records')).reset_index(name='chart_value')
            
        )
        result1 = nested_json1.to_dict(orient='records')
        # json_data1 = json.dumps(result, indent=4)
        # print(json_data)

        sql_stmt = '''select mined_topic as name, 'Topics' as id, 'Trending Topics' as chart_name, 'table' as chart_type, call_frequency,
        case when avg_sentiment < 1 THEN 'negative' when avg_sentiment between 1 and 2 THEN 'neutral' 
        when avg_sentiment >= 2 THEN 'positive' end as average_sentiment
        from
        (
            select mined_topic, AVG(sentiment_int) as avg_sentiment, sum(n) as call_frequency
            from 
            (
                select TRIM(mined_topic) as mined_topic, 1 as n,
                CASE sentiment WHEN 'positive' THEN 3 WHEN 'neutral' THEN 2 WHEN 'negative' THEN 1 end as sentiment_int
                from [dbo].[processed_data]
            ) t
            group by mined_topic
        ) t1'''

        cursor.execute(sql_stmt)

        rows = cursor.fetchall()

        column_names = [i[0] for i in cursor.description]
        df = pd.DataFrame(rows, columns=column_names)

        # charts pt2
        nested_json2 = (
            df.groupby(['id', 'chart_name', 'chart_type']).apply(lambda x: x[['name', 'call_frequency', 'average_sentiment']].to_dict(orient='records')).reset_index(name='chart_value')
            
        )
        result2 = nested_json2.to_dict(orient='records')

        sql_stmt = '''select key_phrase as text1, 'KEY_PHRASES' as id, 'Key Phrases' as chart_name, 'wordcloud' as chart_type, call_frequency as size1,
        case when avg_sentiment < 1 THEN 'negative' when avg_sentiment between 1 and 2 THEN 'neutral' 
        when avg_sentiment >= 2 THEN 'positive' end as average_sentiment
        from
        (
            select top(100) key_phrase, AVG(sentiment_int) as avg_sentiment, sum(n) as call_frequency 
            from 
            (
                select TRIM(key_phrase) as key_phrase, 1 as n,
                CASE sentiment WHEN 'positive' THEN 3 WHEN 'neutral' THEN 2 WHEN 'negative' THEN 1 end as sentiment_int
                from [dbo].[processed_data_key_phrases]
            ) t
            group by key_phrase
            order by call_frequency desc
        ) t1'''

        cursor.execute(sql_stmt)

        rows = cursor.fetchall()

        column_names = [i[0] for i in cursor.description]
        df = pd.DataFrame(rows, columns=column_names)

        nested_json3 = (
            df.groupby(['id', 'chart_name', 'chart_type']).apply(lambda x: x[['text1', 'size1', 'average_sentiment']].to_dict(orient='records')).reset_index(name='chart_value')
            
        )
        result3 = nested_json3.to_dict(orient='records')

        final_result = result1 + result2 + result3
        final_json_data = json.dumps(final_result, indent=4)
        # print(final_json_data)
        
        chart_data = final_json_data
        # [
        #                 {
        #                     "id":"TOTAL_CALLS",
        #                     "chart_name": "Total Calls",
        #                     "chart_type": "card",
        #                     "chart_value": [
        #                         {
        #                             "name": "Total Calls",
        #                             "value": "50000",
        #                             "unit_of_measurement": "",
        #                         }
        #                     ]
        #                 },
        #                 {   
        #                     "id":"AVG_HANDLING_TIME",
        #                     "chart_name": "Average Handling Time",
        #                     "chart_type": "card",
        #                     "chart_value": [
        #                         {
        #                             "name": "Average Handling Time",
        #                             "value": "3.5",
        #                             "unit_of_measurement": "Mins",
        #                         }
        #                     ]
        #                 },
        #                 {
        #                     "id":"SATISFIED",
        #                     "chart_name": "Satisfied",
        #                     "chart_type": "card",
        #                     "chart_value": [
        #                         {
        #                             "name": "Satisfied",
        #                             "value": "80",
        #                             "unit_of_measurement": "%",
        #                         }
        #                     ]
        #                 },
        #                 {
        #                     "id":"SENTIMENT",
        #                     "chart_name": "Topics Overview",
        #                     "chart_type": "donutchart",
        #                     "chart_value": [
        #                         {
        #                             "name": "positive",
        #                             "value": "60"
        #                         },
        #                         {
        #                             "name": "neutral",
        #                             "value": "10"
        #                         },
        #                         {
        #                             "name": "negative",
        #                             "value": "30"
        #                         }
        #                     ]
        #                 },
        #                 {
        #                     "id":"AVG_HANDLING_TIME_BY_TOPIC",
        #                     "chart_name": "Average Handling Time By Topic",
        #                     "chart_type": "bar",
        #                     "chart_value": [
        #                         {
        #                             "name": "Internet Services",
        #                             "value": 1
        #                         },
        #                         {
        #                             "name": "Billing and Payment",
        #                             "value": 2.8
        #                         },
        #                         {
        #                             "name": "Loyalty Programs",
        #                             "value": 3.7
        #                         },
        #                         {
        #                             "name": "International Roaming",
        #                             "value": 4
        #                         },
        #                     ]
        #                 }, 
        #                 {
        #                     "id":"TOPICS",
        #                     "chart_name": "Trending Topics",
        #                     "chart_type": "table",
        #                     "chart_value": [
        #                             { "name": "Plan Pricing", "call_frequency": 60, "average_sentiment": "positive" },
        #                             { "name": "Accounts", "call_frequency": 55, "average_sentiment": "neutral" },
        #                             { "name": "Billing", "call_frequency": 50, "average_sentiment": "negative" },
        #                             { "name": "Customer Service", "call_frequency": 45, "average_sentiment": "neutral" },
        #                             { "name": "Plan Pricing", "call_frequency": 40, "average_sentiment": "positive" },
        #                             { "name": "Accounts", "call_frequency": 35, "average_sentiment": "neutral" },
        #                             { "name": "Billing", "call_frequency": 25, "average_sentiment": "negative" },
        #                             { "name": "Customer Service", "call_frequency": 22, "average_sentiment": "neutral" },
        #                             { "name": "Plan Pricing", "call_frequency": 22, "average_sentiment": "positive" },
        #                             { "name": "Accounts", "call_frequency": 20, "average_sentiment": "neutral" }
        #                     ]
        #                 }, 
        #                 {
        #                     "id":"KEY_PHRASES",
        #                 "chart_name": "Key Phrases",
        #                 "chart_type": "wordcloud",
        #                 "chart_value": [
        #                                 { "text": "Refund", "size": 50, "average_sentiment": "positive" },
        #                                 { "text": "Throttling", "size": 47, "average_sentiment": "neutral" },
        #                                 { "text": "Ticket", "size": 40, "average_sentiment": "negative" },
        #                                 { "text": "Overdue", "size": 37, "average_sentiment": "negative" },
        #                                 { "text": "Roaming", "size": 35, "average_sentiment": "neutral" },
        #                                 { "text": "Phone plane", "size": 33, "average_sentiment": "neutral" },
        #                                 { "text": "Plan upgrade", "size": 30, "average_sentiment": "positive" },
        #                                 { "text": "IMEI", "size": 26, "average_sentiment": "neutral" },
        #                                 { "text": "Refund", "size": 24, "average_sentiment": "positive" },
        #                                 { "text": "Internet Issue", "size": 22, "average_sentiment": "negative" },
        #                                 { "text": "Ticket", "size": 20, "average_sentiment": "negative" },
        #                                 { "text": "Layover", "size": 18, "average_sentiment": "neutral" },
        #                                 { "text": "service", "size": 16, "average_sentiment": "positive" },
        #                                 { "text": "Verification", "size": 15, "average_sentiment": "neutral" },
        #                                 { "text": "upgrade", "size": 15, "average_sentiment": "positive" },
        #                                 { "text": "Bill", "size": 10, "average_sentiment": "negative" },
        #                                 { "text": "Communication", "size": 10, "average_sentiment": "neutral" }
        #                     ]   
        #                 }
        #             ]

        # # [{"chart_name":"satisfaction", "chart_value":[{"name":"yes","count":40,"percentage":80.00},{"name":"no","count":10,"percentage":20.00}]},
        # {"chart_name":"total_calls", "chart_value":[{"name":"calls","count":50}]},
        # {"chart_name":"topics", "chart_value":[{"name":"Internet Services","count":10},{"name":"Billing and Payment","count":10},{"name":"Loyalty Programs","count":10},{"name":"International Roaming","count":10},{"name":"Plan Management","count":10},{"name":"Device Support","count":10},{"name":"Network Connectivity","count":10},{"name":"Parental Controls","count":10}]},
        # {"chart_name":"avg_call_duration", "chart_value":[{"call_id":"69e78f21-8aaf-4488-a8cb-a5fe5c0a4af7", "duration":10},{"call_id":"37fadadd-da85-40e0-884a-191cf63fa61f", "duration":32},
        #                                                            {"call_id":"db42b35d-0d3a-46a4-9821-866f065c7e46", "duration":6},{"call_id":"5030154f-6cc7-425b-9ce7-412246246765", "duration":8},
        #                                                            {"call_id":"f5299c35-c8a4-48f3-82af-23893131c4d9", "duration":15}]}
        #             ]

        json_response = json.dumps(chart_data)
        return func.HttpResponse(json_response, mimetype="application/json", status_code=200)

    elif data_type == 'key_phrases':
        print(data_type)
        key_phrases_data = [{"key_phrase":"Internet Services","frequency":40},
        {"text":"Billing and Payment","frequency":10},
        {"text":"Loyalty Programs","frequency":50},
        {"text":"International Roaming","frequency":19},
        {"text":"Plan Management","frequency":8},
        {"text":"Device Support","frequency":22},
        {"text":"Network Connectivity","frequency":12},
        {"text":"Parental Controls","frequency":45}]

        json_response = json.dumps(key_phrases_data)
        return func.HttpResponse(json_response, mimetype="application/json", status_code=200)
    
    cursor.close()
    conn.close()

