from pathlib import Path


def test_api_requirements_file_exists():
    requirements = Path(__file__).resolve().parents[1] / "requirements.txt"
    assert requirements.exists()

