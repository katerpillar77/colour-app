from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so
from app import db, app

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
