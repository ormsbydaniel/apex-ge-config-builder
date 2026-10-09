---
title: 9-2. Key concepts
---

# 9-2. Key concepts

## Context

In the tutorials so far, we've largely looked at the **outputs** of _Earth Observation_ programmes - clasifications of land use, such as _World Cover_, or other observations of the earth, such as _Above Ground Biomass_, _Soil Water Indexes_ (tutorial 6), _Wind Power Density_ (tutorial 7) and so on. In this exercise we look more at the actual observation data that is used to produced these.

## Multispectral and Hyperspectral data

**Multispectral data** is imagery captured across several distinct wavelength bands of the electromagnetic spectrum, including visible and non-visible light, enabling the identification and analysis of features that may not be distinguishable in ordinary photographs. **Sentinel-2** and **Landsat** data are examples from ESA and NASA/USGS missions respectively.

**Hyperspectral data** extends this concept by capturing information across hundreds of narrow, closely spaced wavelength bands, allowing more detailed identification of materials and their properties based on their unique spectral signatures. **EnMAP (Germany)** and **PRISMA (Italy)** are examples of satellite missions providing hyperspectral imagery.

There are also **commercial suppliers** of both multspectral and hyperspectral data.

In these exercises we will work with some multi-spectral data but the same principles apply to hyperspectral.

## Multispectral / hyperspectral data in COGS

Whilst multispectral data is often supplued in _Cloud Optimised Geotiffs_ the structure of these can vary. On some occasions you may encouter a single COG with different bands of the COG representing the different wavelengths. On other occasions you may find each wavelength is supplied as its own separate COG.
