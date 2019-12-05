import json

clothing_items = ["Clothing", "Top", "Shorts", "Outerwear",  "Dress", "Coat", "Pants",  "Jeans", "Skirt", "Miniskirt",  "Swimwear", "Suit", "Shirt"]
accessory_items = ["Hat", "Glasses", "Helmet","Glove", "Sunglasses", "Fedora", "Scarf","Belt", "Brassiere","Handbag","Underpants", "Backpack", "Tie"]
footwear_items = ["Shoe", "Footwear", "High heels", "Boot", "Sandal" ]
jewelry_items = ["Necklace", "Watch", "Bracelet", "Earrings", "Tiara","Crown"]
animals = ["Animal","Bird", "Tiger", "Dog", "Fish", "Caterpillar", "Turtle", "Moths and butterflies", "Elephant", "Butterfly", "Snake", "Cat", "Lion", "Horse", "Polar bear", "Insect"]
food_items = ["Food", "Apple", "Fruit", "Squash", "Candy",  "Baked goods","Strawberry", "Dessert","Bread"]
home_goods = ["Tableware", "Home appliance",  "Clock", "Poster", "Furniture", "Pillow", "Mirror", "Bench", "Chair", "Houseplant", "Stool", "Couch","Ceiling fan","Table top", "Fireplace","Table", "Window", "Throw pillow"]
goods = [ "Packaged goods", "Luggage & bags", "Ball", "Coin", "Bicycle", "Bicycle wheel", "Bottled and jarred packaged goods", "Umbrella", "Tubed packaged goods","Wine glass","Racket", "Grooming trimmer", "Notebook", "Boxed packaged goods","Bottle","Racket","Basketball", "Wrench", "Balloon","Doll","Spoon"]
lighting = ["Lighting","Light fixture", "Lantern", "Light bulb"]
buildings = [ "Building","Lighthouse", "House"]

def get_obj_name(obj):
  if obj in clothing_items:
    return "Clothing"
  elif obj in accessory_items:
    return "Accessory"
  elif obj in footwear_items:
    return "Footwear"
  elif obj in jewelry_items:
    return "Jewelry"
  elif obj in animals:
    return "Animal"
  elif obj in food_items:
    return "Food"
  elif obj in home_goods:
    return "Home goods"
  elif obj in goods:
    return "Packaged goods"
  elif obj in lighting:
    return "Lighting"
  elif obj in buildings:
    return "Building"
  else:
    return obj


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
            object_name = get_obj_name(obj["name"])
            if object_name in tag_dict[tag_name].keys():
             tag_dict[tag_name][object_name] += obj["score"]
            else:
              tag_dict[tag_name][object_name] = obj["score"]

            if object_name not in colors_dict[tag_name].keys():
              colors_dict[tag_name][object_name] = {"black": 0,
                "blue": 0, "gray":0, "green": 0, "orange": 0,
                "pink": 0, "red": 0, "violet": 0, "white": 0, "yellow": 0}

            colors_dict[tag_name][object_name][book["dominantColorCategory"]] += obj["score"]
        else:
          tag_dict[tag_name] = {}
          colors_dict[tag_name] = {}
          for obj in book["localizedObjectAnnotations"]:
            object_name = get_obj_name(obj["name"])

            tag_dict[tag_name][object_name] = obj["score"]
            if object_name not in colors_dict[tag_name].keys():
              colors_dict[tag_name][object_name] = {"black": 0,
                "blue": 0, "gray":0, "green": 0, "orange": 0,
                "pink": 0, "red": 0, "violet": 0, "white": 0, "yellow": 0}

            colors_dict[tag_name][object_name][book["dominantColorCategory"]] += obj["score"]

      for obj in book["localizedObjectAnnotations"]:
        if object_name in tag_dict["total"].keys():
         tag_dict["total"][object_name] += obj["score"]
        else:
          tag_dict["total"][object_name] = obj["score"]

        if object_name not in colors_dict["total"].keys():
          colors_dict["total"][object_name] = {"black": 0,
            "blue": 0, "gray":0, "green": 0, "orange": 0,
            "pink": 0, "red": 0, "violet": 0, "white": 0, "yellow": 0}

        colors_dict["total"][object_name][book["dominantColorCategory"]] += obj["score"]




for tag_name, tag_entry in tag_dict.items():
    tag_list[tag_name] = []
    for obj_name, score in tag_entry.items():
        tag_list_item = {"name": obj_name, "score": score }
        tag_list_item.update(colors_dict[tag_name][obj_name])
        tag_list[tag_name].append(tag_list_item)



with open('tag_object.json', 'w') as file:
  json.dump(tag_list, file, ensure_ascii=False, indent=4)


