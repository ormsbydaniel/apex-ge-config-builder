---
title: 9-3. Styling multi-spectral data
---

# 9-3. Styling multi-spectral data

In this exercise we will work with an existing configuration. If you are following on from previous exercises you may want to **export your current config**, as we will load up a new one.

1., From the configuration builder **Home** page, select **Load -> Tutorials -> Tutorial 9 pre-requisites**.

    !!!info "About this config"
    This config file has a few multi-spectral datasets already included. Some of these are  from the [**UK Earth Observation Data Hub**](https://eodatahub.org.uk/) so we have also added in support in this config for **British National Grid** as a custom co-ordinate reference system.  Custom CRS definitions are covered in Tutorial 11 if you wish to replicate this elsewhere.

2. Take a look at the **Bristol Sentinel 2 scene** layer in the Sentinel 2 interface group. Right now this is just a normal layer, with a COG added, as you have done before.

- Note how the row in the _Datasets_ tab, tell is it has 10 bands, but they are "undefined".
- Now click on the **( i )** icon on that row to inspect the COG metadata. Note how it has a dropdown of bands and you can inspect the statistics of each individually.

3.  Now lets add some styling. On the main layer card select the **Pen** icon next to the **multi-band visualisations** option. This will open a popup with two tabs, one called **Composites** another called **Indices**. Take a brief look at what is in each.

!!!info "Composites vs indices. What's the difference?"
**Composites** take three bands and visualise them in the _red_, _green_ and _blue_ channels of the output. If the input bands are also red, green and blue wavelengths, then this will look like a natural colour. However, if they are other wavelengths then they will reveal patterns not visible to the naked eye.

**Indices** meanwhile, make per pixel calulations across multiple bands, ending up with a value typically between -1 and +1. These indices reveal interesting insights according to the formula used!

4. Select **Composites -> Natural colour** then **Preview**.

_Content to follow._

### Did you remember to export?
