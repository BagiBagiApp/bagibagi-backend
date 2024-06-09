import sys
import numpy as np
import tensorflow as tf
import json
import requests
import os

tf.keras.utils.get_custom_objects().update({
    'TFOpLambda': tf.keras.layers.Lambda(),
    'tf.math.l2_normalize': tf.math.l2_normalize()
})

def load_model():
    model_url = 'https://storage.googleapis.com/recsys_model/Recommendation_system.h5'
    model_path = '/tmp/Recommendation_system.h5'

    response = requests.get(model_url)
    

    with open(model_path, 'wb') as file:
        file.write(response.content)

    try:
        # ERROR HERE, OBJECT UNCALLABLE (MATH.L2_NORMALIZE)
        return tf.keras.models.load_model(model_path)
    except ValueError as e:
        print(f"Error loading model: {str(e)}")
        # If loading fails, inspect the error message to identify the missing custom objects
        # and add them to the custom_objects dictionary accordingly
        custom_objects = {
            # Add the correct custom objects here
        }
        # error here
        return tf.keras.models.load_model(model_path, custom_objects=custom_objects)
    # return "icha" if returnnya icha, dia bisa masuk ke options dan ngereturn options di postman.


try:
    model = load_model()

    # user_vec = np.array(json.loads(sys.argv[1]))
    # product_vecs = np.array(json.loads(sys.argv[2]))
    


    # predictions = model.predict([user_vec, product_vecs])

    # top_n = 10
    # top_indices = predictions.argsort()[0][-top_n:][::-1]
    # top_products = [int(idx) for idx in top_indices]

    # print(json.dumps(top_products))

    options = {
        "halo": "haloo"
    }

    print(json.dumps(options))

except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1)






# import sys
# import json

# def main():
#     # Ambil argumen dari command line
#     args = sys.argv[1:]

#     # Lakukan sesuatu dengan argumen tersebut
#     result = {
#         "input": args,
#         "message": "Hello from Python!"
#     }

#     # Cetak hasil sebagai JSON
#     print(json.dumps(result))


# main()