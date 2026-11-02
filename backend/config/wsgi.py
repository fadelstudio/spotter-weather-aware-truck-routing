"""
WSGI config for Spotter Weather-Aware Truck Routing.
"""
import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.config.settings')
application = get_wsgi_application()
