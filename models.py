from app import db, app, login
from typing import Optional
import sqlalchemy as sa
import sqlalchemy.orm as so
from sqlalchemy.ext import compiler
from sqlalchemy.schema import DDLElement
from sqlalchemy.sql import table
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from time import time
import jwt

@login.user_loader
def load_user(id):
    return db.session.get(User, int(id))

class User(UserMixin, db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(64), index=True,
                                                unique=True)
    username: so.Mapped[str] = so.mapped_column(sa.String(120), index=True,
                                             unique=True)
    password_hash: so.Mapped[Optional[str]] = so.mapped_column(sa.String(256))
    verified: so.Mapped[bool] = so.mapped_column(sa.Boolean, default=False)
    workspaces=so.relationship('Workspace', back_populates='user', cascade="all, delete")

    def __repr__(self):
        return '{}'.format(self.username)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def is_verified(self):
        return self.verified == True
    
   
    def get_reset_password_token(self, expires_in=600):
        return jwt.encode(
            {'reset_password': self.id, 'exp': time() + expires_in},
            app.config['SECRET_KEY'], algorithm='HS256')

    @staticmethod
    def verify_reset_password_token(token):
        try:
            id = jwt.decode(token, app.config['SECRET_KEY'],
                            algorithms=['HS256'])['reset_password']
        except:
            return
        return db.session.get(User, id)
    
    def get_verify_email_token(self, expires_in=600):
        return jwt.encode(
            {'verify_email': self.id, 'exp': time() + expires_in},
            app.config['SECRET_KEY'], algorithm='HS256')

    @staticmethod
    def verify_verify_email_token(token):
        try:
            id = jwt.decode(token, app.config['SECRET_KEY'],
                            algorithms=['HS256'])['verify_email']
        except:
            return
        return db.session.get(User, id)
    
    def get_delete_account_token(self, expires_in=600):
        return jwt.encode(
            {'delete_account': self.id, 'exp': time() + expires_in},
            app.config['SECRET_KEY'], algorithm='HS256')

    @staticmethod
    def verify_delete_account_token(token):
        try:
            id = jwt.decode(token, app.config['SECRET_KEY'],
                            algorithms=['HS256'])['delete_account']
        except:
            return
        return db.session.get(User, id)
    
class Workspace(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(64), index=True)
    notes: so.Mapped[str] = so.mapped_column(sa.String(256))
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(User.id),
                                               index=True)
    user=so.relationship('User', back_populates='workspaces')
    saved_colours=so.relationship('SavedColour', back_populates='workspace', cascade="all, delete")
    saved_paints=so.relationship('SavedPaint', back_populates='workspace', cascade="all, delete")
    def __repr__(self):
        return '{} owned by {}'.format(self.name, self.user)

class Colour(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    hex: so.Mapped[str] = so.mapped_column(sa.String(6))
    H: so.Mapped[str] = so.mapped_column(sa.Integer)
    S: so.Mapped[str] = so.mapped_column(sa.Integer)
    L: so.Mapped[str] = so.mapped_column(sa.Integer)
    paints=so.relationship('Paint', back_populates='colour')
    saved_colours=so.relationship('SavedColour', back_populates='colour');
    def __repr__(self):
        return '#{}'.format(self.hex)

class Brand(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(64), index=True)
    paints=so.relationship('Paint', back_populates='brand')
    def __repr__(self):
        return '{}'.format(self.name)

class Paint(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    brand_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(Brand.id),
                                               index=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(64), index=True)
    colour_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(Colour.id),
                                               index=True)
    colour=so.relationship('Colour', back_populates='paints')
    brand=so.relationship('Brand', back_populates='paints')
    saved_paints=so.relationship('SavedPaint', back_populates='paint');
    def __repr__(self):
        return '{} {} - {}'.format(self.brand, self.name, self.colour)

class SavedColour(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    name: so.Mapped[str] = so.mapped_column(sa.String(32), index=True)
    notes: so.Mapped[str] = so.mapped_column(sa.String(256))
    colour_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(Colour.id),
                                               index=True)
    workspace_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(Workspace.id),
                                               index=True)
    workspace=so.relationship('Workspace', back_populates='saved_colours', cascade="all, delete")
    colour=so.relationship('Colour', back_populates='saved_colours');
    def __repr__(self):
        return '{} {}'.format(self.name, self.colour)

class SavedPaint(db.Model):
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    notes: so.Mapped[str] = so.mapped_column(sa.String(256))
    paint_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(Paint.id),
                                               index=True)
    workspace_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey(Workspace.id),
                                               index=True)
    workspace=so.relationship('Workspace', back_populates='saved_paints', cascade="all, delete")
    paint=so.relationship('Paint', back_populates='saved_paints');
    def __repr__(self):
        return '{} - {}'.format(self.notes, self.paint)

class CreateView(DDLElement):
    def __init__(self, name, selectable):
        self.name = name
        self.selectable = selectable

class DropView(DDLElement):
    def __init__(self, name):
        self.name = name

@compiler.compiles(CreateView)
def _create_view(element, compiler, **kw):
    return "CREATE VIEW %s AS %s" % (
        element.name,
        compiler.sql_compiler.process(element.selectable, literal_binds=True),
    )

@compiler.compiles(DropView)
def _drop_view(element, compiler, **kw):
    return "DROP VIEW %s" % (element.name)


def view_exists(ddl, target, connection, **kw):
    return ddl.name in sa.inspect(connection).get_view_names()


def view_doesnt_exist(ddl, target, connection, **kw):
    return not view_exists(ddl, target, connection, **kw)


def view(name, metadata, selectable):

    t = sa.table(
        name,
        *(
            sa.Column(c.name, c.type, primary_key=c.primary_key)
            for c in selectable.selected_columns
        ),
    )
    t.primary_key.update(c for c in t.c if c.primary_key)

    sa.event.listen(
        metadata,
        "after_create",
        CreateView(name, selectable).execute_if(callable_=view_doesnt_exist),
    )
    sa.event.listen(
        metadata,
        "before_drop",
        DropView(name).execute_if(callable_=view_exists),
    )
    return t

#with app.app_context():
 #   db.create_all()

