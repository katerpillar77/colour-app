import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'SECRET_KEY=d120d52277d8807d61f135cdbe3bef2e34843f6c65eb6b30'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    RESEND_API=os.environ.get('RESEND_API')
    
