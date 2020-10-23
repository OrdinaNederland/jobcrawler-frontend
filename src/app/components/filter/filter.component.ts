import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { FilterQuery } from 'src/app/models/filterQuery.model';
import { IVacancies } from 'src/app/models/ivacancies';
import { HttpService } from 'src/app/services/http.service';
import { Observable, Subject, ReplaySubject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';
import { PageResult } from 'src/app/models/pageresult.model';
import { Vacancy } from 'src/app/models/vacancy';
import { Skill } from 'src/app/models/skill';
import { Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { Router } from '@angular/router';
import { Location } from 'src/app/models/location';
import {LocationDialogComponent} from '../location-dialog/location-dialog.component';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  providers: [HttpService]
})
export class FilterComponent implements OnInit, OnDestroy {

  isShow = false;
  searchForm: FormGroup;
  skills: Skill[];
  vacancies: IVacancies[] = [];
  locations: string[];
  filteredLocations: Observable<string[]>;
  homeLocation: Location;
  currentLocation: string;

  showForm = false;
  totalVacancies: number;
  pageSize = 15;
  currentPage: number;
  pageEvent: PageEvent;

  sort: Sort;
  sortBy = 'postingDate';
  sortOrder = 'desc';

  public skillMultiCtrl: FormControl = new FormControl();
  public skillMultiFilterCtrl: FormControl = new FormControl();
  public filteredSkillsMulti: ReplaySubject<Skill[]> = new ReplaySubject<Skill[]>(1);
  public onDestroy = new Subject<void>();

  /**
   * Creates an instance of filter component.
   * @param form Constructs form
   * @param filterService Used for http requests (post/get)
   */
  constructor(private form: FormBuilder,
              private httpService: HttpService,
              private dialog: MatDialog,
              private router: Router
  ) {  }

  /**
   * Function gets executed upon initialization.
   * Constructs searchform.
   * Retrieves all vacancies.
   * Detect changes to 'location' field.
   */
  async ngOnInit(): Promise<void> {
    this.locations = this.httpService.getLocations();
    await this.loadForm(); // Need to load form fully before continuing with anything else that might causes errors


    const locationDialogRef = this.dialog.open(LocationDialogComponent);

    locationDialogRef.afterClosed().subscribe(result => {
        this.homeLocation = result;
        this.searchVacancies(this.pageEvent);
        // this.searchForm.controls.location.setValue(this.homeLocation.name);
      }, () => {
      }, () => {
        this.homeLocation = new Location('', undefined, undefined);
        this.searchVacancies(this.pageEvent);
      });
  }

  /**
   * Destroys ngx-mat-select-search upon leaving page
   */
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  /**
   * Toggles display / filter column
   */
  public toggleDisplay(): void {
    this.isShow = !this.isShow;
  }

/*    public toggleDisplayEmptyLocs(): void {
        this.showEmptyLocs = !this.showEmptyLocs;
    }*/

    /**
   * TODO: Connect this function to send request to backend.
   * Converts form to json format. Currently logged to console and calls the getAllVacancies() function.
   */
  public async searchVacancies(pageEvent?: PageEvent): Promise<void> {
    console.log('Test start searchVacancies');

    if (pageEvent !== undefined) {
        this.pageEvent = pageEvent;
    }

    console.log(this.homeLocation);
    if (this.homeLocation.name === '' && this.searchForm.get('location').value !== '') {
        console.log('Test');
        this.homeLocation = new Location(this.searchForm.get('location').value);
        this.homeLocation.setCoord(await this.httpService.getCoordinates(this.homeLocation.name) as number[]);
    }

    let filterQuery: FilterQuery;

    if (this.searchForm !== undefined) {
      filterQuery = this.searchForm.value as FilterQuery;

      if (this.skillMultiCtrl.value !== null) {
        filterQuery.skills = [];
        this.skillMultiCtrl.value.forEach((skill: Skill) => {
          filterQuery.skills.push(skill.name);
        });
      } else {
        filterQuery.skills = [];
      }

      if (!filterQuery.fromDate) {
        filterQuery.fromDate = '';
      }

      if (!filterQuery.toDate) {
        filterQuery.toDate = '';
      }
    } else {
      this.isShow = true;
      filterQuery = new FilterQuery();
      filterQuery.location = '';
      filterQuery.distance = 0;
      filterQuery.includeEmptyLocs = true;
      filterQuery.fromDate = '';
      filterQuery.toDate = '';
      filterQuery.keyword = '';
      filterQuery.skills = [];
    }

        console.log('Test2');

    const pageNum = pageEvent ? pageEvent.pageIndex : 0;
    if (pageEvent) {
      this.pageSize = pageEvent.pageSize;
    }
    this.vacancies = [];
    this.httpService.getByQuery(filterQuery, pageNum, this.pageSize, this.sort)
    .pipe(takeUntil(this.onDestroy))
    .subscribe(async (page: PageResult) => {
        if (page !== null) {
        const tempVacancies: IVacancies[] = [];
            console.log('Test3');
        for (const vacancy of page.vacancies) {
            console.log('Test4');
            if (vacancy.location && this.homeLocation.name !== '') {
                await this.httpService.getDistance(this.homeLocation.getCoord(), [vacancy.location.lon, vacancy.location.lat])
                    .then((result: number) => {
                        vacancy.location.distance = result;
                    });
            }
            tempVacancies.push({
                title: vacancy.title,
                broker: vacancy.broker,
                postingDate: vacancy.postingDate,
                location: vacancy.location,
                id: vacancy.id,
                vacancyUrl: vacancy.vacancyURL
            });
        }
        this.vacancies = tempVacancies;
        this.totalVacancies = page.totalItems;
        this.currentPage = pageNum;
        if (this.sort !== undefined) {
          this.sortBy = this.sort.active;
          this.sortOrder = this.sort.direction;
        }
      } else {
        this.totalVacancies = 0;
        this.currentPage = 0;
      }
    });
  }

  /**
   * Resets form back to default values
   */
  public resetForm(): void {
    this.searchForm.reset(this.constructSearchForm());
    this.skillMultiCtrl.reset();
  }

  /**
   * Easily search and select skills
   * @returns Does not return anything, prevent method to continue
   */
  public filterSkillsMulti(): any {
    if (!this.skills) {
      return;
    }

    let search = this.skillMultiFilterCtrl.value;
    if (!search) {
      this.filteredSkillsMulti.next(this.skills.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredSkillsMulti.next(
      this.skills.filter(skill => skill.name.toLowerCase().indexOf(search) === 0)
    );
  }


  /**
   * Opens login dialog
   */
  public openLoginDialog(): void {
    const dialogRef = this.dialog.open(LoginDialogComponent);
    this.router.events
    .subscribe(() => {
      dialogRef.close();
    });
  }


  /**
   * Changes sorting with current search criteria
   * @param sort column/order
   */
  public changeSorting(sort: Sort) {
    this.sort = sort;
    this.searchVacancies(this.pageEvent);
  }


  /**
   * Loads form asynchronous
   */
  private loadForm(): Promise<any> {
    return new Promise((resolve) => {
      this.getSkills().then((data: any) => {
        const skillData: Skill[] = [];
        data._embedded.skills.forEach((skill: any) => {
          skillData.push({
            href: skill._links.self.href,
            name: skill.name
          });
        });
        this.skills = skillData;
        this.filteredSkillsMulti.next(this.skills.slice());
        this.constructSearchForm().then(() => {
          this.showForm = true;
          this.isShow = false;
          resolve();
        });
      },
      err => {
        console.log('Failed loading form');
        console.log(err.message);
        resolve();
      });
    });
  }


  /**
   * Gets skills
   * @returns skills as Promise
   */
  private getSkills(): Promise<any> {
    return this.httpService.findAllSkills().toPromise();
  }


  /**
   * Filters location
   * @param search entered string
   * @returns matching locations to entered string
   */
  private _filterLocation(search: string): string[] {
    return this.locations.filter(value => value.toLowerCase().indexOf(search.toLowerCase()) === 0);
  }


  /**
   * Constructs search form
   * @returns empty search form
   */
  private constructSearchForm(): Promise<any> {
    return new Promise((resolve) => {
      this.searchForm = this.form.group({
        keyword: '',
        location: '',
        skills: '',
        distance: '',
        includeEmptyLocs: true,
        fromDate: '',
        toDate: ''
      });

      this.filteredLocations = this.searchForm.get('location')!.valueChanges
        .pipe(
          startWith(''),
          map(value => this._filterLocation(value || ''))
        );

      this.skillMultiFilterCtrl.valueChanges
      .pipe(takeUntil(this.onDestroy))
      .subscribe(() => {
        this.filterSkillsMulti();
      });

      resolve();
    });
  }
}
