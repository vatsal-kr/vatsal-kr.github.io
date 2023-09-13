---
layout: page
title: Topic Discovery using Latent Dirichlet Allocation for Recommender System
description: Created a recommendation system to map relevant questions to qualified professionals on CareerVillage
img: assets/img/ggm.png
importance: 3
category: all
---
[Link to report](https://drive.google.com/file/d/11A5svDfOZCIzsuQbyVxalAY8ZikCPWvJ/view) 

The aim of the project is to showcase the use of Latent Dirichlet Allocation (LDA) for topic modeling as a part of a larger project. For this purpose, we use the [CareerVillage Data Science for Good dataset](https://www.kaggle.com/competitions/data-science-for-good-careervillage/overview) from Kaggle.  
CareerVillage is a website that provides free career advice to underprivileged students. One of the key issues students face is lack of access to qualified guidance counselors, which are far fewer than the number of students. CareerVillage has built an online Q&A platform where volunteers can answer career related questions as per their expertise. However, one of the problems the platform is facing is to efficiently match questions to volunteers who have the required expertise to answer them. CareerVillage seeks to crowd-source a solution to this problem through this challenge. Formally, the objective is – "given a student question, match it to volunteers/professionals who are most qualified and likely to answer them".  The data for this problem, a huge collection of questions, answers, and associated metadata (who answered the question, how was the answer ranked, etc.)

The data contains questions and their associated "tags", and also contains volunteers with the same set of "tags", indicating expertise in that field. However, a large number of questions are untagged. To this end, we use the LDA algorithm to infer these tags based on the question. Further, to match questions to the respective professionals, we consider other questions similar to the one in consideration, as well as the previously answered questions and tags of each expert to compute a relevance score for each expert. 
