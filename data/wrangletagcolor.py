import json
import colorsys

tag_dict = {}

tag_dict_entry = {}

# tag_dict = {
#   "TAG": {
#     "red": {
#       "score": 0,
#       "frequency": 0,
#       "totalPixelFraction": 0
#     }
#   }
# }

books_by_color = {}

primarycolors = ["red", "orange", "yellow", "green", "blue",
  "violet", "pink", "gray", "black", "white"]

for color in primarycolors:
  books_by_color[color] = []
  tag_dict_entry[color] = {"score": 0, "frequency": 0,
  "totalPixelFraction": 0}

with open('tag_object.json') as jsonfile:
  data = json.load(jsonfile)
  for tag in data.keys():
    tag_dict[tag] = tag_dict_entry


def colorCategorize(color):
  for c in ["red", "green", "blue"]:
    if c not in color:
      color[c] = "0"

  (h, l, s) = colorsys.rgb_to_hls(int(color["red"])/255, int(color["green"])/255, int(color["blue"])/255)
  level1 = ""
  level2 = "" # do this later
  hue = h*360
  lightness = l*100
  saturation = s*100

  if lightness < 20:
    level1 = "black"
  elif lightness >= 90:
    level1 = "white"
  elif saturation < 10:
    level1 = "gray"
  elif hue <= 12 or hue >= 336:
    level1 = "red"
  elif hue > 12 and hue < 38:
    level1 = "orange"
  elif hue >= 38 and hue < 62:
    level1 = "yellow"
  elif hue >= 62 and hue < 150:
    level1 = "green"
  elif hue >= 150 and hue < 250:
    level1 = "blue"
  elif hue >= 250 and hue < 292:
    level1 = "violet"
  elif hue >= 292 and hue < 336:
    level1 = "pink"

  return level1, hue, lightness, saturation




with open("book_data.json") as json_file:
  data = json.load(json_file)
  for book in data:

    if "imagePropertiesAnnotation" in book:
      colorsLst = book["imagePropertiesAnnotation"]["dominantColors"]["colors"]
      primaryColor, h, l, s = colorCategorize(colorsLst[0]["color"])
      if int(book["book_id"] ) % 500 == 0:
        print("BOOK: " + book["book_id"])
        print(colorsLst[0]["color"])
        print(primaryColor, h, l, s)
      if "tags" in book and primaryColor:
        for tag in book["tags"]:
          if tag["tag_name"] in tag_dict.keys():
            tag_dict[tag["tag_name"]][primaryColor]["score"] += float(colorsLst[0]["score"])
            tag_dict[tag["tag_name"]][primaryColor]["frequency"] += 1
            tag_dict[tag["tag_name"]][primaryColor]["totalPixelFraction"] += float(colorsLst[0]["pixelFraction"])


      # secondaryColor = colorCategorize(colorsLst[1]["color"])

# calculate average pixel fraction
for tag_name, tag in tag_dict.items():
  for color_name, color in tag.items():
    if color["frequency"] > 0:
      color["averagePixelFraction"] = color["totalPixelFraction"]/color["frequency"]
    else:
      color["averagePixelFraction"] = 0



with open('tag_color.json', 'w') as file:
  json.dump(tag_dict, file, ensure_ascii=False, indent=4)


