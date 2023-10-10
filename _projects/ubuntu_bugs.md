---
layout: page
title: Ubuntu Bug Severity Prediction  
description: Predicting the urgency of bugs reported on the Ubuntu Forum    
img: assets/img/am.png
importance: 1
category: all
---
[Link to report](https://drive.google.com/file/d/1m2z_ijqMcRDGScokAposMaYAcGD8MBFz/view?usp=sharing) 

The aim of the project is to predict the bug severity (aka bug heat) of a given bug on the Ubuntu bugs forum. An accurate prediction would help developers prioritize their work, and lead to more efficient patching. Previous work uses the natural language descriptions of the bug reports as well as the comments to make this prediction. We propose to use knowledge graphs for this task.  

We mine a dataset from the Ubuntu bugs forum from 2004 to 2019, containing ~280K bug reports, their metadata and the bug severity. We then build a bug-bug and bug-package graph, where an edge between a bug and a package indicates that the bug affects the package and an edge between two bugs imply that they affect atleast one common package. We then use this knowledge graph to improve our prediction, both using a hand-crafted approach like generating the degree, centrality and clustering coefficients, and using Graph Neural Networks like GCN, GraphSAGE and GAT initialized with the sentence embeddings of the descriptions and comments. We find the latter approach to outperform the best text-based approach in low-data settings by a huge margin. However in the abundance of data, text-based methods perform marginally better.