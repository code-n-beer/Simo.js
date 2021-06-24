from flask import Flask, request, jsonify
app = Flask(__name__)
from transformers import pipeline, PreTrainedModel, GPTNeoForCausalLM
from pprint import pprint
import torch
import shortuuid

torch.zeros(10, 10).to('cuda:0') # early check that GPU works

default_settings = {
  "do_sample":True,
  "min_length":40,
  "max_length":500, 
  "length_penalty":1.0, 
}

#print('starting models')
#generator = pipeline('text-generation', model='EleutherAI/gpt-neo-1.3B', device=0)
#print('model loaded')

if __name__ != '__main__':
   print('not main, starting models')
   generator = pipeline('text-generation', model='EleutherAI/gpt-neo-1.3B', device=0)
   print('model loaded')
#else:
#   print('main, skip models')
#   generator = None

def write_to_file(input_str):
  uuid = shortuuid.uuid()

  filename = "%s.html" % uuid
  with open('/mlsimo-data/output/' + filename, "w", encoding="utf8") as text_file:
    text_file.write(input_str)
    
  return filename

def wrap_pre(result_str):
    if "<html>" in result_str.lower():
        return result_str
    else:
        return "<pre>\n" + result_str + "\n</pre>"
    

def gen(prompt, bad_words, settings):
  if settings is None:
    settings = default_settings
  if settings['max_length'] > 20000:
    settings['max_length'] = 20000

  if bad_words and len(bad_words > 0):
    ebun = generator(prompt, **settings,
      bad_words_ids=generator.tokenizer(bad_words)['input_ids'])
  else:
    ebun = generator(prompt, **settings)

  output = ebun[0]['generated_text']
  output = wrap_pre(output)
  filename = write_to_file(output)

  return filename, output


print('starting server')

@app.route('/')
def index():
  return 'Server Works!'
  
@app.route('/gpt', methods=['POST'])
def add_message():
  content = request.json
  prompt = content['prompt']
  bad_words = content['bad_words'] if 'bad_words' in content else None
  settings = content['settings'] if 'settings' in content else None

  filename, output = gen(prompt, bad_words, settings)

  return jsonify({'filename': filename, 'output': output})

#if __name__ == '__main__':
#  app.run(host= '0.0.0.0', port=8000, debug=False, threaded=False, processes=0)
#  print('server started, 0.0.0.0:8000')

  

