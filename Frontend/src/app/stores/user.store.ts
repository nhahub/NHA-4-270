import { Injectable, signal, computed, inject } from '@angular/core';
import { User, Role } from '../core/models/app.models';
import { UserService } from '../core/services/user.service';
import { RoleService } from '../core/services/role.service';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private userService = inject(UserService);
  private roleService = inject(RoleService);

  // States
  private _users = signal<User[]>([]);
  private _roles = signal<Role[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Filters
  public readonly searchQuery = signal<string>('');

  // Read-only public signals
  public readonly users = computed(() => this._users());
  public readonly roles = computed(() => this._roles());
  public readonly loading = computed(() => this._loading());
  public readonly error = computed(() => this._error());

  // Filtered users
  public readonly filteredUsers = computed(() => {
    let list = this._users();
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(u => 
        u.firstName.toLowerCase().includes(query) || 
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    }
    return list;
  });

  public loadUsersAndRoles(): void {
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      users: this.userService.getUsers(),
      roles: this.roleService.getRoles()
    })
    .pipe(finalize(() => this._loading.set(false)))
    .subscribe({
      next: (res) => {
        this._users.set(res.users);
        this._roles.set(res.roles);
      },
      error: (err) => this._error.set(err.message || 'Failed to load user and role directory')
    });
  }

  public saveUser(user: User, onSuccess?: () => void): void {
    this._loading.set(true);
    this.userService.saveUser(user)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadUsersAndRoles();
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to save user')
      });
  }

  public deleteUser(id: number, onSuccess?: () => void): void {
    this._loading.set(true);
    this.userService.deleteUser(id)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadUsersAndRoles();
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to remove user')
      });
  }

  public saveRole(role: Role, onSuccess?: () => void): void {
    this._loading.set(true);
    this.roleService.saveRole(role)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => {
          this.loadUsersAndRoles();
          if (onSuccess) onSuccess();
        },
        error: (err) => this._error.set(err.message || 'Failed to save role permissions')
      });
  }
}
