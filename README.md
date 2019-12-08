# A Cover Worth 1000 Words 
This repo holds the final visualization project for CS171. Using data from Google’s Vision API, and the GoodBooks data set compiled by zygmuntz on GitHub, we’ve explored how the aesthetic features of color and symbols vary across book covers of different genres, and how these variances might affect a user’s perception of the book.

# How is this repo organized?
We have organized all the files in the following directory structure

/
  
  -- css (All stylesheets used for this project)
 
  -- js (All js files used are stored here)
  
  -- img (Directory for all images)
  
  -- data (Directory for raw data + pre-aggregated data + wrangling script)
  
index.html (Parent html file with the static content and id elements)

# Links to screen cast and website
Screencast:
https://youtu.be/qVMfxGXjMpg

Final website:
http://isabellezheng.com/cs171-final-project/#1

## data
This directory has the following sub directories -

-- **goodreads** (This contains the raw data from zygmuntz that we used for this project. This directory is in fact a clone from zygmuntz)

-- **book_data.json** (This json file integrates zygmuntz's data with Google Vision API output which has the most dominant color information. The script **wrangledata.py** has the implementation details)

-- **book_data_lite.json** (Owing to the large size of the book_data.json (which is around 70 MB), we created a sub selection of columns. We are also binning the years and doing pre-filtering of books older than 1900 here. This was created using **colorviz_datawrangling.py**)

-- **genrebyyearpct.json** (This file shows the pre-aggregated data from book_data and computes the percentage distribution of colors by 8 most commonly occuring genres between 1900 and 2017 by genre and year bin. The calculations are done using Python and can be found in **colorviz_datawrangling.py**)

-- **summarybygenre.json** (This file shows the pre-aggregated data from book_data and computes the percentage distribution of colors by 8 most commonly occuring genres by genre. The calculations are done using Python and can be found in **colorviz_datawrangling.py**)

-- **tag_color.json and hierarchy_tag_color.json** (These files have pre-aggregated data from book_data and computes the frequency distribution of colors by tags and colors. They are organized to aid treemap viz and the stacked area chart. The calculations are done using Python and can be found in **wrangletagcolor.py**)

-- **tag_frequency.json** (This file shows the pre-aggregated data from book_data and computes the count of colors by tags. The calculations are done using Python and can be found in **wrangletagobject.py**)

## css
We use **Bootstrap** grid framework to organize the content. All custom styles are in **styles.css** file.

# Outside libraries used
 We have used the following libraries 
 
 /
 
-- Scrollify

-- jQuery

-- D3

-- Queue

-- Bootstrap
    
-- Lodash
    
-- Combobox
    
-- Popper
    
-- TextStroke
    
-- PanelSnap
    
