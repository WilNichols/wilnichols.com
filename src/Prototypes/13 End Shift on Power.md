---
date: 2020-09-02T11:00
author: Wil Nichols
tags:
  - Type/Prototype
  - Topic/Microinteractions
  - Company/Zello
  - Tool/Origami
preview: 
  title: 'End Shift on Power'
  class: themed-1x
  meta: /assets/vid/end-shift--light.png
  dir: prototypes/end-shift
  assets:
    - media: '(prefers-color-scheme: dark)'
      poster: 'end-shift-poster--dark.png'
      source: 'end-shift--dark@3x.mp4'
    - media: '(prefers-color-scheme: light)'
      poster: 'end-shift-poster--light@3x.png'
      source: 'end-shift--light@3x.mp4'

---
When using shared devices, Zello users need to start and end their shifts, releasing the device for use by the next shift. It’s straightforward for users to start shift, but reminding them to end shifts is difficult. Instead, we explored contextual cues we could use to trigger shift ends — time of day, frequency of use, session length, and whether a device has been plugged into power for a given duration. This prototype demonstrates a custom `UIAlertViewController` design that shows the ending-shift countdown, and that timeout selecting the “End Now” button.
