---
layout: post
date: 2021-12-18 16:00:00+0500
inline: true
---
Won the Natural Language Inference track of the IndoML Datathon 2022
<!-- The IndoML Datathon was organized as a part of the IndoML Symposium 2021 and was  organized by a team consisting of academics and researchers from IIT Gandhinagar, IIT Kharagpur, University of Warwick, Google, and Microsoft Research with a theme of “Data for AI and AI for Data”. The broad aim of this Datathon is to invite participants to gain experience in solving real world data science/ML problems posed by experts in industry and academia.  

The challenge comprised of a Conversational Code-switched Natural Language Inference dataset, in English and Hindi (written in Roman script). The premise is a multi-turn dialog and hypothesis is a sentence. Unlike the traditional NLI task, which is to determine whether the hypothesis is entailed by or contradicts with the premise, here, the task is to predict whether the inference of contradiction or entailment would require some sort of external knowledge or not.  

```
Premise: Obama was the President of USA.
Hypothesis: Obama's family lived in the white house.
Inference: Entailment
```
The external knowledge (external to the provided text) required is "US presidents lives in the white house during their tenure." So, the predicted label  should be 1.  
---
The gold-winning approach comprised of obtaining the RoBERTa embeddings by passing the premise and hypothesis through the encoder, concatenating the obtained embeddings, reducing its dimensionality to 128 using PCA, concatenating the NLI label (0 or 1), and passing it through a multi-layer perceptron. This baseline obtained an F1 score of 0.8991.   -->
