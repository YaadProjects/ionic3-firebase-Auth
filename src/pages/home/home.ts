import { FirebaseProvider } from './../../providers/firebase/firebase.service';
import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FirebaseListObservable } from "angularfire2/database";
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {
  newItem: any;
  userForm: FormGroup;
  passReset = false;

  formErrors = {
    'email': '',
    'password': ''
  };

  validationMessages = {
    'email': {
      'required': 'Email is required.',
      'email': 'Email must be a valid email'
    },
    'password': {
      'required': 'Password is required.',
      'pattern': 'Password must be include at one letter and one number.',
      'minlength': 'Password must be at least 4 characters long.',
      'maxlength': 'Password cannot be more than 40 characters long.',
    }
  };

  items: FirebaseListObservable<any[]>;

  constructor(public navCtrl: NavController,
    public firebaseProvider: FirebaseProvider,
    private fb: FormBuilder) {
    if (this.firebaseProvider.conectado())
      this.items = this.firebaseProvider.getItems();

    console.log(this.items);
  }
  ngOnInit(): void {
    this.buildForm();
    if (this.firebaseProvider.conectado())
      this.items = this.firebaseProvider.getItems();
  }

  login(): void {
    this.firebaseProvider.entrarComEmailEPassword(this.userForm.value['email'], this.userForm.value['password']);
    this.items = this.firebaseProvider.getItems();
  }

  conectado() {
    return this.firebaseProvider.conectado();
  }
  signOut() {
    this.firebaseProvider.signOut();
  }

  buildForm(): void {
    this.userForm = this.fb.group({
      'email': ['', [
        Validators.required,
        Validators.email
      ]
      ],
      'password': ['', [
        // Validators.pattern('^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$'),
        Validators.minLength(6),
        Validators.maxLength(25)
      ]
      ],
    });

    this.userForm.valueChanges.subscribe(data => this.onValueChanged(data));
    this.onValueChanged(); // reset validation messages
  }

  // Updates validation state on form changes.
  onValueChanged(data?: any) {
    if (!this.userForm) { return; }
    const form = this.userForm;
    for (const field in this.formErrors) {
      // clear previous error message (if any)
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid) {
        const messages = this.validationMessages[field];
        for (const key in control.errors) {
          this.formErrors[field] += messages[key] + ' ';
        }
      }
    }
  }

  resetPassword() {
    this.firebaseProvider.resetPassword(this.userForm.value['email'])
      .then(() => this.passReset = true)
  }

  addItem() {
    this.firebaseProvider.addItem(this.newItem);
    this.newItem = '';
  }

  removeItem(id) {
    this.firebaseProvider.removeItem(id);
  }




}
