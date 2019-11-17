from google.cloud import vision
from google.protobuf.json_format import MessageToDict
import csv
import time
import json

BATCH_SIZE = 16

stop_tags = ["favorites",
    "to-read", "books-i-own", "currently-reading", "owned",
    "favourites", "owned-books", "re-read", "all-time-favorites",
    "default", "my-books", "reread", "i-own", "audiobook",
    "5-stars", "favorite-books", "favorite", "audiobooks",
    "read-more-than-once", "my-library",  "read-in-2016",
    "re-reads", "my-favorites", "own-it",  "library",
    "audio", "faves", "favorite-series", "read-in-2015",
    "kindle", "favourite", "to-buy", "shelfari-favorites",
    "read-in-2014", "to-re-read", "all-time-favourites",
    "childhood-favorites", "ebook", "rereads", "read-in-english",
    "5-star", "read-in-2017", "favourite-books", "on-my-shelf",
    "my-bookshelf", "bookshelf", "favs", "audio-books", "have",
    "read-in-2013", "read-in-2011", "finished", "borrowed",
    "books-i-have", "mine", "re-reading", "wish-list", "recommended",
    "pdf", "read-2016", "read-2015", "unfinished", "did-not-finish",
    "must-read"]

books = []

book_tags = {}

tag_frequency = {}

tags = {}

with open('goodbooks/books.csv') as csvfile:
  reader = csv.DictReader(csvfile)
  for row in reader:
    books.append(row)
    book_tags[row["goodreads_book_id"]] = []

with open('goodbooks/tags.csv') as csvfile:
  reader = csv.DictReader(csvfile)
  for row in reader:
    tags[row["tag_id"]] = row["tag_name"]

with open('goodbooks/book_tags.csv') as csvfile:
  reader = csv.DictReader(csvfile)
  for row in reader:
    tag_dict = {"tag_id": row["tag_id"], "count": row["count"],
          "tag_name": tags[row["tag_id"]]}
    if tags[row["tag_id"]] in tag_frequency:
      tag_frequency[tags[row["tag_id"]]] += 1
    else:
      tag_frequency[tags[row["tag_id"]]] = 1
    if len(book_tags[row["goodreads_book_id"]]) < 10 and  tag_dict["tag_name"] not in stop_tags:
      book_tags[row["goodreads_book_id"]].append(tag_dict)


trunc_books = books

client = vision.ImageAnnotatorClient()
features  = [
  vision.types.Feature(type=vision.enums.Feature.Type.IMAGE_PROPERTIES,
      max_results= 10),
  vision.types.Feature(type=vision.enums.Feature.Type.OBJECT_LOCALIZATION,
      max_results= 10),
]

list_of_requests = []
i = 0
list_of_requests.append([])

for book in trunc_books:
  image_source = vision.types.ImageSource(image_uri=book["image_url"])
  image = vision.types.Image(source=image_source)

  request = vision.types.AnnotateImageRequest(image=image,
    features=features)
  if len(list_of_requests[i]) < BATCH_SIZE:
    list_of_requests[i].append(request)
  else:
    i += 1
    list_of_requests.append([request])

print(len(list_of_requests))


list_of_annotation_responses = []
for k in range(len(list_of_requests)):
  print("REQUEST " + str(k))
  requests = list_of_requests[k]
  list_of_annotation_responses.append(client.batch_annotate_images(requests))
  if k % 100 == 0:
    time.sleep(60)

new_books = []

for j in range(len(list_of_annotation_responses)):
  annotation_response = list_of_annotation_responses[j]
  for i in range(len(annotation_response.responses)):
    response = annotation_response.responses[i]
    response = MessageToDict(response)
    book = trunc_books[j*BATCH_SIZE + i]


    new_row = {**book, **response}

    new_row["title_word_count"] = len(new_row["original_title"])

    new_row["tags"] = book_tags[new_row["goodreads_book_id"]]

    new_books.append(new_row)

with open('book_data.json', 'w') as file:
  json.dump(new_books, file, ensure_ascii=False, indent=4)
# with open('tag_frequency.json', 'w') as file:
#   json.dump(tag_frequency, file, ensure_ascii=False, indent=4)
