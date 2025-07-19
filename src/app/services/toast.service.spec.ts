import { TestBed } from '@angular/core/testing';
import { ToastService, ToastType } from './toast.service';
import { take } from 'rxjs';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit a success toast message', (done) => {
    const message = 'Operation completed';

    service.toast$.pipe(take(1)).subscribe((toast) => {
      expect(toast.message).toBe(message);
      expect(toast.type).toBe('success');
      done();
    });

    service.showToast(message, 'success');
  });

  it('should emit an error toast message', (done) => {
    const message = 'Something went wrong';

    service.toast$.pipe(take(1)).subscribe((toast) => {
      expect(toast.message).toBe(message);
      expect(toast.type).toBe('error');
      done();
    });

    service.showToast(message, 'error');
  });

  it('should default to success type if no type is passed', (done) => {
    const message = 'Default type test';

    service.toast$.pipe(take(1)).subscribe((toast) => {
      expect(toast.message).toBe(message);
      expect(toast.type).toBe('success'); // default
      done();
    });

    service.showToast(message); // no type passed
  });
});
