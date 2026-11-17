# Anonymous Video Supplement

Qualitative indoor reconstruction comparisons: 32 videos across six distinct scenes in five collections. Collection 02 compares eight methods; the other collections compare six. Collections 02 and 05 share a scene but show different trajectories.

Collection 02 demonstrates structural consistency as the camera moves through the corridor into a bedroom using our scene-level multi-panorama reconstruction.

The video gallery shows scene panoramas, method names, visual observations, and synchronized playback along matched target-camera paths. Panorama images can be opened at full resolution. These qualitative videos supplement the quantitative evaluation. Detailed model configurations are documented in comparison-protocol.json.

No analytics, external embeds, author links or third-party fonts are included.

The experimental-details page (`notes.html`) discusses direct Gaussian predictors and their possible integration, audited dataset distributions, verification outcomes, and model-training and per-environment costs. Its LRM discussion documents the native prediction setup and the proposed initialization-and-refinement extension.

The revised LRM comparison uses two adjacent original panoramas separated by 1.086 m, with the same 156 target cameras. PanoSplatt3R uses the complete ERPs and official scale recovery; NoPoSplat uses two corridor-facing 90-degree crops. The later bedroom views extend beyond the shared coverage of those crops. Analysis and matched full frames are in analysis.html; numeric camera/input configuration is in comparison-protocol.json.
