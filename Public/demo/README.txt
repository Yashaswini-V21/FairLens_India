Demo assets for FairLens frontend testing

Files:
- sample_dataset.csv: Demo CSV you can upload from the audit modal.
- sample_model.pkl: Demo sklearn model for quick audit run.

How these were generated:
python -c "from scripts.smoke_test import generate_sample_assets; from pathlib import Path; generate_sample_assets(Path('Public/demo'))"
