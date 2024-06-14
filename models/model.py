# -*- coding: utf-8 -*-
import json
import pandas as pd
import re
import sys
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory
import nltk
from nltk.corpus import stopwords
from dotenv import load_dotenv
from pymongo import MongoClient
import os

# Suppress nltk download messages
nltk.download('stopwords')

# Load environment variables
load_dotenv()

mongodb_uri = os.getenv("MONGODB_URI")
client = MongoClient(mongodb_uri)
db = client['capstone']
collection = db['jobs']

# Fetch data from MongoDB
data = list(collection.find({}, {'vacany name': 1, 'vacancy description': 1, 'company name': 1, 'company description': 1, 'vacany location': 1}))
df_jobs = pd.DataFrame(data)
df_jobs.fillna('', inplace=True)

# Convert columns to string before concatenation
df_jobs['vacany name'] = df_jobs['vacany name'].astype(str)
df_jobs['vacancy description'] = df_jobs['vacancy description'].astype(str)
df_jobs['company name'] = df_jobs['company name'].astype(str)
df_jobs['company description'] = df_jobs['company description'].astype(str)
df_jobs['vacany location'] = df_jobs['vacany location'].astype(str)

def clean_text(input):
    html = r"<.*?>"
    symb = r'[\/(){}\[\]\|@,;]'
    text = re.sub(html, ' ', input)
    text = re.sub(symb, ' ', text)
    return ' '.join(text.split())

df_jobs['vacancy description'] = df_jobs['vacancy description'].apply(clean_text)
df_jobs['company description'] = df_jobs['company description'].apply(clean_text)
df_jobs['soup'] = df_jobs['vacany name'] + ' ' + df_jobs['vacancy description'] + ' ' + df_jobs['company name'] + ' ' + df_jobs['company description'] + ' ' + df_jobs['vacany location']

stopword_factory = StopWordRemoverFactory()
stopwords_indo = stopword_factory.get_stop_words()
stopwords_english = set(stopwords.words('english'))
comb_stopwords = list(set(stopwords_indo) | stopwords_english)
indices = pd.Series(df_jobs['vacany name'])

count = CountVectorizer(stop_words=comb_stopwords)
count_matrix = count.fit_transform(df_jobs['soup'])
cosine_sim_count = cosine_similarity(count_matrix, count_matrix)

def get_recommendations(jobs, n):
    job_name = find_job_name(jobs)
    if job_name is None:
        return "Maaf, belum ada pekerjaan yang sesuai"
    idx = indices[indices == job_name].index[0]
    sim_scores = list(enumerate(cosine_sim_count[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[0:n]

    jobs_indices = [i[0] for i in sim_scores]
    jobs_scores = [i[1] for i in sim_scores]

    recommended_jobs = df_jobs['vacany name'].iloc[jobs_indices]

    return list(zip(recommended_jobs, jobs_scores))

def find_job_name(raw):
    filtered = list(indices)
    for word in raw.lower().split():
        filtered = [title for title in filtered if word in title.lower()]
        if not filtered:
            return None
    return filtered[0]

def topnforeach(tags, n):
    dicts = {}
    for tag in tags:
        dicts[tag] = get_recommendations(tag, n)
    return dicts

if __name__ == "__main__":
    # Parse input arguments
    if len(sys.argv) < 2:
        print("Usage: python model.py '<JSON string>' [n]")
        sys.exit(1)

    input_data = sys.argv[1]
    jobs_dict = json.loads(input_data)
    tags = jobs_dict.get("jobs", [])
    if not tags:
        print("No jobs provided in input.")
        sys.exit(1)

    n = int(sys.argv[2]) if len(sys.argv) > 2 else 5

    # Get recommendations
    recommendations = topnforeach(tags, n)
    print(json.dumps(recommendations, ensure_ascii=False, indent=4))


# tags = ['android', 'Machine Learning', 'asdasd']
# print(topnforeach(tags, 5))

