#!/usr/bin/env python
# coding: utf-8

# In[1]:


import colorsys
import pandas as pd
import numpy as np
import re
from matplotlib import pyplot as plt
import webcolors
import json
get_ipython().run_line_magic('matplotlib', 'inline')


# In[2]:


def get_hex_code(color):
    result = re.match(r'^#?([a-f0-9]{3,3}|[a-f0-9]{6,6})$', color)
    
    if result is None:
        raise Exception('Could not extract color')
        
    result = list(result.group(1))

    if len(result) == 6:
        result = [result[i] + result[i+1] for i in range(0, len(result), 2)]
    else:
        result = [result[i] + result[i] for i in range(0, len(result))]
        
    return [int(hex_code, 16) for hex_code in result]
    
def calculate_luminace(color_code):
    index = float(color_code) / 255 

    if index < 0.03928:
        return index / 12.92
    else:
        return ( ( index + 0.055 ) / 1.055 ) ** 2.4
    
def calculate_relative_luminance(rgb):
    return 0.2126 * calculate_luminace(rgb[0]) + 0.7152 * calculate_luminace(rgb[1]) + 0.0722 * calculate_luminace(rgb[2]) 

def calculate_contrast_ratio(col1_hex, col2_hex):
    color_one = get_hex_code(col1_hex)
    color_two = get_hex_code(col2_hex)
    light = color_one if sum(color_one) > sum(color_two) else color_two
    dark = color_one if sum(color_one) < sum(color_two) else color_two
    contrast_ratio = ( calculate_relative_luminance(light) + 0.05 ) / ( calculate_relative_luminance(dark) + 0.05 )
    return contrast_ratio

# Reference - https://github.com/Peter-Slump/python-contrast-ratio


# In[3]:


def rgb2hsv(r, g, b):
    r, g, b = r/255.0, g/255.0, b/255.0
    mx = max(r, g, b)
    mn = min(r, g, b)
    df = mx-mn
    if mx == mn:
        h = 0
    elif mx == r:
        h = (60 * ((g-b)/df) + 360) % 360
    elif mx == g:
        h = (60 * ((b-r)/df) + 120) % 360
    elif mx == b:
        h = (60 * ((r-g)/df) + 240) % 360
    if mx == 0:
        s = 0
    else:
        s = df/mx
    v = mx
    return h, s, v


# In[4]:


# Read the raw books json file
df = pd.read_json("book_data_updated.json")


# In[5]:


df.columns


# In[6]:


# Create a df subset.
main = df[['book_id','authors', 'original_publication_year','original_title', 'image_url', 'title','average_rating', 
           'ratings_count', 'title_word_count', 'tags', 'dominantColorCategory']]

# Rename dominant color category to the original name used in prototype (so that stuff does not break)
main.rename(columns={'dominantColorCategory':'dominant_color_categorized'}, inplace=True)

# Create bins for years for stacked bar. We need to filter out anything older than 1900 since there are not many books.
bin_size = 5
year_range =[] # Placebolder for year ranges.
main['original_publication_year'] = pd.to_numeric(main['original_publication_year'])
main = main[np.logical_and(main.original_publication_year >= 1900, main.original_publication_year <= 2017)].reset_index(drop=True)
# Find the bin index for a bin size of 5.
main["bin_index"] = np.digitize(main.original_publication_year, np.arange(1900, 2020, bin_size))
# Translate the bin index number to a year range.
for i, ele in enumerate(main.bin_index):
    year_range.append(str((5*(main.bin_index[i]-1)) + 1900) + '-' + str(5*main.bin_index[i] + 1900))
main["year_range"] = pd.Series(year_range)
main.drop(columns=['bin_index'], inplace=True)

# Calculate the hex codes for the most dominant and second most dominant color. Calculate contrast ratio.
second_most_dominant_color = []
dominant_color = []
contrast_ratio = []
for i in range(0,len(main)):
    try:
        dominant_index = np.argmax([ele['pixelFraction'] for ele in df.imagePropertiesAnnotation[i]["dominantColors"]["colors"]])
        second_most_dominant_index = np.argsort([ele['pixelFraction'] for ele in df.imagePropertiesAnnotation[i]["dominantColors"]["colors"]])[-2]

        most_dominant_color_val = df.imagePropertiesAnnotation[i]["dominantColors"]["colors"][dominant_index]["color"]
        second_most_dominant_color_val = df.imagePropertiesAnnotation[i]["dominantColors"]["colors"][second_most_dominant_index]["color"]       

        most_dominant_color_rgb = (int(most_dominant_color_val['red']),int(most_dominant_color_val['green']) , int(most_dominant_color_val['blue']))
        second_most_dominant_color_rgb = (int(second_most_dominant_color_val['red']),int(second_most_dominant_color_val['green']) , int(second_most_dominant_color_val['blue']))
        
        dominant_color.append(webcolors.rgb_to_hex(most_dominant_color_rgb))
        second_most_dominant_color.append(webcolors.rgb_to_hex(second_most_dominant_color_rgb))
        contrast_ratio.append(calculate_contrast_ratio(webcolors.rgb_to_hex(most_dominant_color_rgb),webcolors.rgb_to_hex(second_most_dominant_color_rgb) ))
 
    except:
        dominant_color.append('missing')
        second_most_dominant_color.append('missing')
        contrast_ratio.append('missing')


# In[7]:


# Deduplicate and standardize tag keys.
tag_keys = []
for ele in main.tags:
    tag_names = []
    for m in ele:
        tag_names.append(m['tag_name'].lower())
    tag_keys.append(list(set(tag_names)))


# In[8]:


# Deduplicate and standardize objects.
main_objects = []
for ele in df.localizedObjectAnnotations:
    temp_val = []
    try:
        for m in ele:
            temp_val.append(m['name'].lower())
    except:
        temp_val.append('')
    main_objects.append(list(set(temp_val)))


# In[9]:


# Add all calculated fields onto the calculations.
main['dominant_color'] = pd.Series(dominant_color)
main['second_most_dominant_color'] = pd.Series(second_most_dominant_color)
main['contrast_ratio'] = pd.Series(contrast_ratio)
main['tags'] = pd.Series(tag_keys)
main['objects'] = pd.Series(main_objects)


# In[10]:


# Summary of 8 genres.
eight_genres = {
    'young_adult': '.*young.adult*',
    'science_fiction': '.*science.fiction*',
     'fantasy': '.*fantasy*',
    'children': '.*children*',
    'historic': '.*historic*',
    'thriller': '.*thriller*',
    'romance': '.*romance*',
    'paranormal': '.*paranormal*'
}


# In[11]:


years = []
genres = []
for year_range in main.year_range.unique():
    for genre in eight_genres:
        years.append(year_range)
        genres.append(genre)
genre_by_year_range = pd.DataFrame({'year_range': years, 'genre': genres}).sort_values(by= ['genre','year_range'])


# In[12]:


genre = pd.Series([ele for ele in eight_genres])

colors_by_genre = []

year_range_by_genre_combined = pd.DataFrame(columns = ['black', 'blue', 'gray', 'green', 'orange', 'pink', 
                                                       'red', 'violet','white', 'yellow', 'genre', 'year_range'])

shift_degree = [5, 2, 0, 17, 15, 12, 10, 7]

for i,ele in enumerate(eight_genres):
    genre_details = {}
    genre_details['genre'] = ele
    r = re.compile(eight_genres[ele])
    indices = np.array([i for i,ele in enumerate(main['tags']) if len(list(filter(r.match, ele))) != 0])
    filtered = main.iloc[indices]
    
    year_range_by_genre = filtered.groupby(['year_range','dominant_color_categorized']).count().reset_index()
    year_range_by_genre['genre'] = ele
    year_range_by_genre = year_range_by_genre[['genre','year_range', 'dominant_color_categorized', 'book_id']]
    year_range_by_genre['key'] = year_range_by_genre.genre.str.cat(year_range_by_genre.year_range, sep='*')
    pivoted_year_genre = year_range_by_genre.pivot(index='key', columns='dominant_color_categorized')['book_id'].reset_index()
    pivoted_year_genre['genre'] = np.arange(0,len(pivoted_year_genre))
    pivoted_year_genre['year_range'] = np.arange(0,len(pivoted_year_genre))
    for index, ele in enumerate(pivoted_year_genre['key']):
        pivoted_year_genre.iloc[index,11] = (ele.split('*')[0])
        pivoted_year_genre.iloc[index,12] = (ele.split('*')[1])
    pivoted_year_genre.drop(['key'], axis=1, inplace = True)
    pivoted_year_genre.fillna(0, inplace=True)
    
    summary = filtered.groupby(['dominant_color_categorized']).count().reset_index().sort_values(by=['book_id'], ascending=False)
    genre_details['color'] = list(summary['dominant_color_categorized'])

    genre_details['count'] = list(summary['book_id'])
    genre_details['percentage'] = list(np.round(summary['book_id']*100/np.sum(summary['book_id']),0))
    # Circle angle calculation.
    starting_array = np.array(range(20 - shift_degree[i], 20 - shift_degree[i] + len(genre_details['color'])))
    genre_details['angle_index'] = [float(ele%20) for ele in starting_array]
    colors_by_genre.append(genre_details)
    
    # Append values
    year_range_by_genre_combined = year_range_by_genre_combined.append(pivoted_year_genre, ignore_index= True)


# In[13]:


with open('/Users/lekshmisanthosh/Downloads/summarybygenre.json', 'w') as fout:
    json.dump(colors_by_genre, fout)


# In[14]:


# Rearrange the column names.
cols = ['genre', 'year_range', 'black', 'blue', 'gray', 'green', 'orange', 'pink','red', 'violet','white', 'yellow']
year_range_by_genre_combined = year_range_by_genre_combined[cols]


# In[15]:


genre = []
years = []
for ele in eight_genres:
    for year_range in main.year_range.unique():
        genre.append(ele)
        years.append(year_range)
all_years_genre = pd.DataFrame({'genre': genre, 'year_range': years})


# In[16]:


year_range_by_genre_combined = pd.merge(all_years_genre, year_range_by_genre_combined, how='outer', on=['genre','year_range']).sort_values(by=['genre','year_range'])
year_range_by_genre_combined.fillna(0, inplace=True)


# In[17]:


total = year_range_by_genre_combined.groupby(['year_range']).sum().reset_index()
total['genre'] = 'total'
total = total[cols]


# In[18]:


year_range_by_genre_combined = year_range_by_genre_combined.append(total)
year_range_by_genre_combined['sum'] = np.zeros((216, ))
for ele in cols[2:]:
    year_range_by_genre_combined['sum'] += year_range_by_genre_combined[ele]
    
year_range_by_genre_combined.to_json(path_or_buf = '/Users/lekshmisanthosh/Downloads/genrebyyear.json', orient = 'records')


# In[19]:


year_range_by_genre_combined_pct = year_range_by_genre_combined.copy()
for ele in year_range_by_genre_combined.columns[2:12]:
    year_range_by_genre_combined_pct[ele] = year_range_by_genre_combined_pct[ele]/year_range_by_genre_combined_pct["sum"]


# In[20]:


main.to_json(path_or_buf = '/Users/lekshmisanthosh/Downloads/book-data-lite.json', orient = 'records')


# In[21]:


year_range_by_genre_combined_pct.to_json(path_or_buf = '/Users/lekshmisanthosh/Downloads/genrebyyearpct.json', orient = 'records')

