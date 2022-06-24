---
layout: page
title: That's the Good Word
description:
img: assets/img/12.jpg
importance: 1
category: work
---

The project is based around a famous General Championship event at IIT Kharagpur, *What's the Good Word*, wherein teams of three compete to guess 5 words in the shortest possible time.  

The major rules of the game are:
1. Each team consists of one *passer* and two *guesser*
2. The passer gets a list of 5 words, which have to be guessed in the fastest possible time. To aid with this, the passer must pass exactly three words.
3. The three words passed must not contain any three consecutive letters from the word to be guessed.
4. The first word must be related to the word to be guessed.
5. Although the second and third word can be anything, a commonly followed strategy is to choose them such that the first two letters of the second and third word make up the first four letters of the word to be guessed.
6. In case of improbable alphabet combinations, plurals can be passed.
7. For some commonly recurring prefixes and suffixes, there is a list of exceptions, which can be passed as the second and the first word respectively.

Let's have a look at some examples
{% raw %}
```html
Example 1:  
Word 1: fire, Word 2: exact, Word 3: tip  
```
{% endraw %}  

Now think of a word starting with "exti" (ex from exact, ti from tip) and related to fire  
*DRUMROLLLL*  
No points for guessing "extinguish". Let's do another one
{% raw %}
```html
Example 1:  
Word 1: culture, Word 2: eternal, Word 3: hens  
```
{% endraw %}  

Note that the third word passed is a **plural**, hence, its first and third alphabet must be used.  
Now, related to culture and starting with "ethn". What's the Good Word?... *ethnic*!

Easy right? Well every freshman inducted into this cult of an event thought so as well. The rules mentioned are just a subset, and this seemingly harmless contest lasts for about 8 hours in practice. So, to alleviate the pain of countless souls, I bring to you an automated solution to this heart wrenching competition: *That's the Good Word*
