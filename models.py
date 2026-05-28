from app import db, app, login
from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

@login.user_loader
def load_user(id):
    return db.session.get(User, int(id))


class User(UserMixin, db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    username: so.Mapped[str] = so.mapped_column(sa.String(64), index=True,
                                                unique=True)
    email: so.Mapped[str] = so.mapped_column(sa.String(120), index=True,
                                             unique=True)
    password_hash: so.Mapped[Optional[str]] = so.mapped_column(sa.String(256))
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    ##paints=so.relationship('Paint', back_populates='brand')

class Brand(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(64), index=True)
    paints=so.relationship('Paint', back_populates='brand')

class Colour(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    R: so.Mapped[str] = so.mapped_column(sa.Integer)
    G: so.Mapped[str] = so.mapped_column(sa.Integer)
    B: so.Mapped[str] = so.mapped_column(sa.Integer)
    H: so.Mapped[str] = so.mapped_column(sa.Integer)
    S: so.Mapped[str] = so.mapped_column(sa.Integer)
    L: so.Mapped[str] = so.mapped_column(sa.Integer)
    paints=so.relationship('Paint', back_populates='colour')
    def __repr__(self):
        return '<Colour {}>'.format(self.id)

class Paint(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    brand_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(Brand.id),
                                               index=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(64), index=True)
    colour_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(Colour.id),
                                               index=True)
    colour=so.relationship('Colour', back_populates='paints')
    brand=so.relationship('Brand', back_populates='paints')
    def __repr__(self):
        return '<Paint {}>'.format(self.name)

with app.app_context():
    db.create_all()
