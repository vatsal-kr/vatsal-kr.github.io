---
layout: page
title: Pre-trained model fusion
description: Explored the impact of several pre-trained model fusion strategies on the performance of Legal NER systems
img: assets/img/ptmf.jpg
importance: 2
category: all
---
[Link to code](https://github.com/vatsal-kr/LegalNER-CS60075)  
[Link to report](https://drive.google.com/file/d/1uTS5oGIhPWyqAVL7R44m1E0sGo0WDDWW/view)  
Pre-trained model fusion is the process of using several finetuned models to create a new base model. This can be achieved in several ways, but the approaches that we investigate are as follows
* Averaging the weights of the pre-trained and fine-tuned model with more weight given to the fine-tuned model.
* Averaging the weights of two pre-trained models of the same family, and before fine-tuning.
* Fine-tuning a given model on two datasets and computing the weighted average of the weights of the resulting models.



We consider several baseline and state-of-the-art models for this task like LegalBERT, LegalRoBERTa and InLegalBERT. We perform our analysis on the [SemEval 2023 task for Legal NER dataset.](https://sites.google.com/view/legaleval/home) Our results indicate that model fusion is not an effective method to create new models, as the base version almost always outperforms the fused models. Among the three methods investigated, we find the first method to be the most effective in an NER setting.