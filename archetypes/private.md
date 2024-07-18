---
title: "{{ replace .TranslationBaseName "-" " " | title }}"

date: {{ .Date }}
draft: true
description: "" # important for proper SEO!!
summary: "" 

tags: []
categories: []
series: ""
weight: 0

featuredImage: ""
featuredImagePreview: ""

math: false
lightgallery: false # only set true if linked images in post

# settings for privacy
hiddenFromHomePage : true
hiddenFromSearch : true
noindex : true

# for extremely long posts the toc does not fit if unfolded.
toc:
    auto : true
---

<!--more-->