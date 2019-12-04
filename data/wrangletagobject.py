import json

clothing_items = ["Shoe", "Footwear", "Necklace", "Hat", "Glasses", "Watch", "Bracelet", "Top", "Shorts", "Outerwear", "Helmet", "Dress", "Coat", "Earrings", "Glove", "High heels" ]
animals = ["Bird", "Tiger", "Dog", "Fish", "Caterpillar"]
food_items = ["Apple", "Fruit", "Squash"]
goods = ["Tableware", "Bracelet", "Luggage & bags", "Home appliance", "Light fixture", "Ball", "Clock", "Coin", "Bicycle", "Bicycle wheel", "Bottled and jarred packaged goods"]


tag_dict = {}
tag_dict["total"] = {}

colors_dict = {}
colors_dict["total"] = {}

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

            if obj["name"] not in colors_dict[tag_name].keys():
              colors_dict[tag_name][obj["name"]] = {"black": 0,
                "blue": 0, "gray":0, "green": 0, "orange": 0,
                "pink": 0, "red": 0, "violet": 0, "white": 0, "yellow": 0}

            colors_dict[tag_name][obj["name"]][book["dominantColorCategory"]] += obj["score"]
        else:
          tag_dict[tag_name] = {}
          colors_dict[tag_name] = {}
          for obj in book["localizedObjectAnnotations"]:
            tag_dict[tag_name][obj["name"]] = obj["score"]
            if obj["name"] not in colors_dict[tag_name].keys():
              colors_dict[tag_name][obj["name"]] = {"black": 0,
                "blue": 0, "gray":0, "green": 0, "orange": 0,
                "pink": 0, "red": 0, "violet": 0, "white": 0, "yellow": 0}

            colors_dict[tag_name][obj["name"]][book["dominantColorCategory"]] += obj["score"]

      for obj in book["localizedObjectAnnotations"]:
        if obj["name"] in tag_dict["total"].keys():
         tag_dict["total"][obj["name"]] += obj["score"]
        else:
          tag_dict["total"][obj["name"]] = obj["score"]

        if obj["name"] not in colors_dict["total"].keys():
          colors_dict["total"][obj["name"]] = {"black": 0,
            "blue": 0, "gray":0, "green": 0, "orange": 0,
            "pink": 0, "red": 0, "violet": 0, "white": 0, "yellow": 0}

        colors_dict["total"][obj["name"]][book["dominantColorCategory"]] += obj["score"]




for tag_name, tag_entry in tag_dict.items():
    tag_list[tag_name] = []
    for obj_name, score in tag_entry.items():
        tag_list_item = {"name": obj_name, "score": score }
        tag_list_item.update(colors_dict[tag_name][obj_name])
        tag_list[tag_name].append(tag_list_item)



with open('tag_object.json', 'w') as file:
  json.dump(tag_list, file, ensure_ascii=False, indent=4)


