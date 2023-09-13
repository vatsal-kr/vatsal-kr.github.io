---
layout: page
title: Query-Focused Medical Text Summarization
description: Investigating the status of QFS in the medical domain    
img: assets/img/qfs.png
importance: 1
category: all
---
[Link to report](https://drive.google.com/file/d/1Yf1UFv824UlMN8jlyXJGV7_YpepInKlR/view?usp=sharing) 

We conduct a comprehensive comparison of several extractive and abstractive models for medical summarization like Pointer-Generator, COWTS+UMLS and BERTSumm in a query-focused setting. Initial results indicate a better performance of extractive models compared to abstractive approaches. However, due to the large number of novel tokens in the reference summaries of abstractive summarization algorithms, a naive semantic overlap tends to favour extractive approaches due to their simple copy-and-paste approach. Hence, we modify the ROUGE score to account for similar Universal Medical Language System (UMLS) concepts (i.e. fever and flu will be considered the same), to alleviate some of this bias. The performance of extractive and abstractive approaches are much more comparable, and in line with the evaluations performed by medical professionals.