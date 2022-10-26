---
layout: page
title: That's the Good Word
description: An automated solution to IIT Kharagpur's What's the Good Word Event
img: assets/img/Wordnet_Graph.png
importance: 1
category: work
---


The project is based around a famous General Championship event at IIT Kharagpur, *What's the Good Word*, wherein teams of three compete to guess 5 words in the shortest possible time. The code for the project can be found at [[Link]](https://colab.research.google.com/drive/1NL2IPqTA52eR8ZcC0j1MVP5PIg5sG0q3?usp=sharing).

Without going too much into the nitty-gritty details, the major rules of the game are:
1. Each team consists of one *passer* and two *guessers*
2. The passer is handed a list of 5 words, and the objective is to make the guessers guess these words in the fastest possible time, using exactly three words.
  * The words passed must not contain any three consecutive letters from the target word.
  * The first word MUST be related (synonym, antonym or any tangible connection) to the target word.
  * The second and third word are unrestricted, but a common strategy is to have the first two letters of the second and third word to add up to the first four letters of the target word.
  * If either the second or the third word is a plural, the first and *third* letter must be considered for that particular word rather than the second. This is done to account for improbable letter combinations.
3. For some commonly recurring prefixes and suffixes, there is a list of exceptions, which can be passed as the second and the first word respectively [[List of Exceptions]](https://docs.google.com/spreadsheets/d/1SjtPXUxPH2jiHzzsh-F8BqBM1vnmzaKF/edit?usp=sharing&ouid=100634968880432823493&rtpof=true&sd=true).

For clarity, look at the illustrated examples listed below
{% raw %}
```html
Example 1:  
Word 1: fire, Word 2: exact, Word 3: tip  
```
{% endraw %}

Think of a word starting with "exti" (ex from exact, ti from tip) and related to "fire", and you end up with "extinguish".
{% raw %}
```html
Example 2:  
Word 1: culture, Word 2: eternal, Word 3: hens  
```
{% endraw %}  

Note that the third word passed is **plural**, hence, its first and third alphabet must be used. A word related to "culture" and starting with "ethn"... We get "ethnic"!

{% raw %}
```html
Example 3:  
Word 1: plan, Word 2: dupe, Word 3: coup  
```
{% endraw %}
Note that the second word passed is "dupe", which is an exception for the prefix "con". A word related to "plan" and starting with "conco"... We get "concoct"

{% raw %}
```html
Example 4:  
Word 1: murder, Word 2: house, Word 3: mine  
```
{% endraw %}
The first word is "murder", which is an exception that implies a suffix "cide". So, a word that is related to "murder", ends with "cide" and begins with "homi"... Rather unsurprisingly, we get homicide.


The rules and regulations for the event are very knotted and complex, thereby making human efforts invariably riddled with errors, costing the team a penalty. Therefore, it would be interesting to see how advances in Natural Language Processing can counter this algorithm, and how it compares to expert and naive human attempts.
