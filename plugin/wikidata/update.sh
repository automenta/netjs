#!/bin/bash
path=http://www.wikidata.org/wiki/Wikidata:List_of_properties
for page in Person Generic Organization Events Works Terms Geographical_feature Others
do
	echo $page
	wget $path/$page?action=render -O $page.html
done


