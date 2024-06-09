import sys
import numpy as np # type: ignore
import tensorflow as tf # type: ignore
import json
import requests # type: ignore
import os

model_url = 'https://storage.googleapis.com/recsys_model/Recommendation_system.h5'
model_path = '/tmp/Recommendation_system.h5'

response = requests.get(model_url)
with open(model_path, 'wb') as file:
    file.write(response.content)

model = tf.keras.models.load_model(model_path)

user_vec = np.array(json.loads(sys.argv[1]))
product_vecs = np.array(json.loads(sys.argv[2]))

predictions = model.predict([user_vec, product_vecs])

top_n = 10
top_indices = predictions.argsort()[0][-top_n:][::-1]
top_products = [int(idx) for idx in top_indices]

print(json.dumps(top_products))
