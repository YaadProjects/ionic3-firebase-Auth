import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { User } from "../../models/user/user";

import * as firebase from 'firebase/app';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/switchMap';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as _ from 'lodash'

@Injectable()
export class FirebaseProvider {
  userId: string = null;

  bsUser: BehaviorSubject<User> = new BehaviorSubject(null);

  userRoles: Array<string>;
  authState: any = null;

  constructor(private afDB: AngularFireDatabase,
    private afAuth: AngularFireAuth
  ) {
    // this.afAuth.authState.subscribe((auth) => {
    //   this.authState = auth
    //   console.log(auth);
    // });

    this.afAuth.authState
      .switchMap(auth => {
        if (auth) {
          /// signed in
          console.log("Logged In: ");
          console.log(auth);
          this.userId = auth.uid;
          return this.afDB.object('users/' + auth.uid);

        } else {
          /// not signed in
          console.log("NOT Logged In: ");
          return Observable.of(null)
        }
      })
      .subscribe(user => {
        this.bsUser.next(user)
      });

    // this.afAuth.authState.subscribe((auth) => {
    //   return this.userRoles = _.keys(_.get(auth, 'roles'))
    // });

  }

  conectado(): boolean {
    return this.userId ? true : false;
  }

  entrarComEmailEPassword(email: string, password: string) {
    console.log(email);
    console.log(password);
    return this.afAuth.auth.signInWithEmailAndPassword(email, password)
      .then(credential => {
        this.afDB.object('users/' + credential.uid).subscribe(user => {
          this.userRoles = _.keys(_.get(user, 'roles'));
          console.log(this.userRoles);
        });
       
        console.log("authenticaton data1: ");
        console.log(credential);
        this.updateUser(credential);
      })
  }

  googleLogin() {
    return this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(credential => {
        console.log(credential.user);
        this.updateUser(credential.user);
      })
  }

  signOut() {
    this.afAuth.auth.signOut()
  }

  //// Update user data ////
  /// updates database with user info after login
  /// only runs if user role is not already defined in database
  private updateUser(authData) {
    console.log("authenticaton data2: ");
    console.log(authData);
    const userData = new User(authData);
    const ref = this.afDB.object('users/' + authData.uid);
    console.log(ref);
    // ref.take(1)
    ref.subscribe(user => {
      console.log("Subscribe do ref");
      console.log(user);
      if (!user.roles) {
        ref.update(userData)
      }
    })
  }


  // emailLogin(email: string, password: string) {
  //   return this.afAuth.auth.signInWithEmailAndPassword(email, password)
  //     .then((user) => {
  //       this.authState = user
  //       this.updateUserData()
  //     })
  //     .catch(error => console.log(error));
  // }

  //// Helpers ////

  private updateUserData(): void {
    const path = `users/${this.authState.uid}`;
    const data = {
      email: this.authState.email,
      name: this.authState.displayName
    }

    this.afDB.object(path).update(data)
      .catch(error => console.log(error));

  }

  // Sends email allowing user to reset password
  resetPassword(email: string) {
    const fbAuth = firebase.auth();

    return fbAuth.sendPasswordResetEmail(email)
      .then(() => console.log("email sent"))
      .catch((error) => console.log(error))
  }

  getItems() {
    console.log("chamou get items!!!");
    return this.afDB.list('/simplelist');
  }

  addItem(item) {
    if (this.canAdd) {
      return this.afDB.list('/simplelist').push(item);
    }
    else console.log('action ADD prevented!')
  }

  removeItem(id) {
    this.afDB.list('simplelist').remove(id);
  }

  get canAdd(): boolean {
    const allowed = ['admin']
    return this.matchingRole(allowed)
  }

  ///// Authorization Logic /////
  get canRead(): boolean {
    const allowed = ['admin', 'author', 'reader']
    return this.matchingRole(allowed)
  }
  get canEdit(): boolean {
    const allowed = ['admin', 'author']
    return this.matchingRole(allowed)
  }
  get canDelete(): boolean {
    const allowed = ['admin']
    return this.matchingRole(allowed)
  }
  /// Helper to determine if any matching roles exist
  private matchingRole(allowedRoles): boolean {
    return !_.isEmpty(_.intersection(allowedRoles, this.userRoles))
  }
  //// User Actions
  editPost(post, newData) {
    if (this.canEdit) {
      return this.afDB.object('posts/' + post.$key).update(newData)
    }
    else console.log('action prevented!')
  }
  deletePost(key) {
    if (this.canDelete) {
      return this.afDB.list('posts/' + key).remove()
    }
    else console.log('action prevented!')
  }


}
