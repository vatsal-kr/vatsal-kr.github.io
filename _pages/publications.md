---
layout: page
permalink: /Publications/
title: Publications
description: Publications with the most recent one first
years: [2024]
nav: true
nav_order: 1
---
_pages/publications.md
<div class="publications">

{%- for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f papers -q @*[year={{y}}]* %}
{% endfor %}

</div>
