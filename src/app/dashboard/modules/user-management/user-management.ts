import { ChangeDetectionStrategy, Component} from '@angular/core';
import { UserTable } from '../../../shared/components/user-table/user-table';

@Component({
  selector: 'app-user-management',
  imports: [UserTable],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserManagement{
}
