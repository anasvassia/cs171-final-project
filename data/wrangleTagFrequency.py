import json

tag_dict = {}
tag_list = []

with open("book_data.json") as json_file:
  data = json.load(json_file)
  for book in data:
    for tag in book["tags"]:
      if tag["tag_name"] in tag_dict:
        tag_dict[tag["tag_name"]] += 1
      else:
        tag_dict[tag["tag_name"]] = 1

for tag_name, frequency in tag_dict.items():
  tag_list.append({"tag_name": tag_name, "frequency": frequency})

with open('tag_frequency.json', 'w') as file:
  json.dump(tag_list, file, ensure_ascii=False, indent=4)
