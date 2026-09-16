.PHONY: serve build update-kaggle update-oss-statuses optimize-images check-links

serve:
	bundle exec jekyll serve

build:
	bundle exec jekyll build

update-kaggle:
	python scripts/update_kaggle_leaderboard.py
	git add assets/data/march-madness-2026/kaggle_leaderboard.json
	git commit -m "Update Kaggle leaderboard ranking"
	git push

update-oss-statuses:
	python3 scripts/update_oss_statuses.py

optimize-images:
	python scripts/optimize_images.py

check-links:
	python scripts/check_links.py
