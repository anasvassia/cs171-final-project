import json

tag_dict = {}
tag_dict["total"] = {}

tag_list = {}
tag_list["total"] = []

with open("book_data.json") as json_file:
  data = json.load(json_file)
  for book in data:
    if int(book["book_id"]) % 1000 == 0:
      print("BOOK: " + book["book_id"])
    if "localizedObjectAnnotations" in book and book["image_url"] != "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png":
      for tag in book["tags"]:
        tag_name = tag["tag_name"]
        if tag_name in tag_dict.keys():
          for obj in book["localizedObjectAnnotations"]:
            if obj["name"] in tag_dict[tag_name].keys():
             tag_dict[tag_name][obj["name"]] += obj["score"]
            else:
              tag_dict[tag_name][obj["name"]] = obj["score"]
        else:
          tag_dict[tag_name] = {}
          for obj in book["localizedObjectAnnotations"]:
            tag_dict[tag_name][obj["name"]] = obj["score"]
      for obj in book["localizedObjectAnnotations"]:
        if obj["name"] in tag_dict["total"].keys():
         tag_dict["total"][obj["name"]] += obj["score"]
        else:
          tag_dict["total"][obj["name"]] = obj["score"]



for tag_name, tag_entry in tag_dict.items():
    tag_list[tag_name] = []
    for obj_name, score in tag_entry.items():
        tag_list[tag_name].append({"name": obj_name, "score": score})


with open('tag_object.json', 'w') as file:
  json.dump(tag_list, file, ensure_ascii=False, indent=4)


