import {Component, OnInit, ViewChild, HostListener, Input, ElementRef} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {FormControl} from '@angular/forms';
import {DdiService} from '../ddi.service';
import {TranslateService} from '@ngx-translate/core';
import {SelectionModel} from '@angular/cdk/collections';

@Component({
  selector: 'app-var',
  templateUrl: './var.component.html',
  styleUrls: ['./var.component.css']
})
export class VarComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @Input() variableGroups: any;



  variableGroupsVars = [];
  datasource: MatTableDataSource<any>;
  public searchFilter = new FormControl();
  _variables;
  renderedData = null;
  mode = 'all';
  private filterValues = { search: '', _show: true };

  constructor(private ddiService: DdiService,
              private translate: TranslateService) { }

  ngOnInit() {
    this.ddiService.currentSearchInput.subscribe(message => this.searchFilter.patchValue(''));
    this.searchFilter.valueChanges.subscribe(value => {
      this.filterValues['search'] = value;
      this.datasource.filter = JSON.stringify(this.filterValues);
    });

  }


  // Entry point - when data has been loaded
  onUpdateVars(data) {
    this._variables = data;
    // make sure all the data is set to show
    for (let i = 0; i < this._variables.length; i++) {
      this._variables[i]._show = true;
      // also make sure it has a label
      if (typeof this._variables[i].labl === 'undefined') {
        this._variables[i].labl = { '#text': '',  '@level': 'variable' };
      }
    }
    // show if var is _in_group
    this.updateGroupsVars(true);
    this.datasource = new MatTableDataSource(this._variables);
    this.datasource.sort = this.sort;
    console.log(this.datasource);
    this.datasource.paginator = this.paginator;
    // sorting
    this.datasource.sortingDataAccessor = (datasort: any, property: string) => {
      switch (property) {
        case 'id':
          return +datasort['@ID'].replace(/\D/g, '');
        case 'name':
          return datasort['@name'];
        case 'labl':
          return datasort.labl['#text'];
        case '_order':
          return datasort._order;
        case 'wgt-var':
          if (datasort['@wgt'] === 'wgt') {
            return datasort['@wgt'];
          }
          return datasort['@wgt-var'];
        default:
          return '';
      }
    };
    // filter
    this.datasource.filterPredicate = this.createFilter();
    this.datasource.connect().subscribe(d => this.renderedData = d);
  }

  createFilter(): (data: any, filter: string) => boolean {
    const filterFunction = function(data, filter): boolean {
      const searchTerms = JSON.parse(filter);
      try {
        return (
          data['@ID']
            .toString()
            .toLowerCase()
            .indexOf(searchTerms.search.toLowerCase()) !== -1 ||
          data['@name']
            .toString()
            .toLowerCase()
            .indexOf(searchTerms.search.toLowerCase()) !== -1 ||
          data['labl']['#text']
            .toString()
            .toLowerCase()
            .indexOf(searchTerms.search.toLowerCase()) !== -1
        );
      } catch (e) {
        return false;
      }
    };
    return filterFunction;
  }

  getPageSizeOptions(): number[] {
    if (typeof this.datasource !== 'undefined') {
      if (this.datasource.paginator.length > 100) {
        return [25, 50, 100, this.datasource.paginator.length];
      } else if (this.datasource.paginator.length > 50 && this.datasource.paginator.length < 100) {
        return [25, 50, this.datasource.paginator.length];
      } else if (this.datasource.paginator.length > 25 && this.datasource.paginator.length < 50) {
        return [25, this.datasource.paginator.length];
      } else if (this.datasource.paginator.length >= 0 && this.datasource.paginator.length < 25) {
        return [this.datasource.paginator.length];
      } else {
        return [25, 50, 100];
      }
    } else {
      return [25];
    }

  }

  onView(_id) {
 /*   const data = this.getObjByID(_id, this._variables);
    // open a dialog showing the variables
    this.dialogStatRef = this.dialog.open(VarStatDialogComponent, {
      width: '35em',
      data: data,
      panelClass: 'field_width'
    });*/
  }

  getDisplayedColumns() {
    let displayedColumns = []; // 'order_arrows'

    displayedColumns = [
        'id',
        'name',
        'labl',
        'wgt-var',
        'view'
    ];
    return displayedColumns;
  }

  @HostListener('matSortChange', ['$event'])
  sortChange(sort) {

    let vars = [];

    for (let i = 0; i < this._variables.length; i++) {
      if (this._variables[i]['_show']) {
        vars.push(this._variables[i]);
      }
    }
    this.datasource.data = vars;
    this.datasource.data.sort();
    this.datasource.connect().subscribe(d => this.renderedData = d);

  }

  // get the var
  getObjByID(_id, _data) {
    for (const i of _data) {
      const obj = i;
      if (obj['@ID'] === _id) {
        return obj;
      }
    }
  }

  onSubset(_ids, sort?) {
    if (_ids == null) {
      this.mode = 'all';
    } else {
      this.mode = 'group';
    }

    const data = [];
    let ungroupedCount = 0;
    let obj;
    for (let i = 0; i < this._variables.length; i++) {
      obj = this._variables[i];
      if (this.mode === 'group') {
        if (_ids.indexOf(obj['@ID']) !== -1) {
          obj._order = _ids.indexOf(obj['@ID']);
          obj._show = true;
          data.push(obj);
        } else {
          ungroupedCount += 1;
          obj._order = 99999 + ungroupedCount;
          obj._show = false;
        }
      } else if (this.mode === 'all') {
        obj._order = null;
        obj._show = true;
        data.push(obj);
      }
    }
    obj._active = false;
    this.filterValues['_show'] = true;
    this.datasource.filter = JSON.stringify(this.filterValues);

    // Showing all
    //this.checkSelection(); // and enable group dropdown if applicable
    this.datasource.data = data;
    if (this.mode === 'group') {
      if (sort == null || sort) {
        this.sortByOrder();
        this.paginator.firstPage();
      }
    } else {
      if (sort == null || sort) {
        this.sort.sort({id: '', start: 'asc', disableClear: false});
        this.paginator.firstPage();
      }
    }

  }



  updateGroupsVars(load?) {
    this.getVariableGroupsVars();
    for (let i = 0; i < this._variables.length; i++) {
      if (this.variableGroupsVars.indexOf(this._variables[i]['@ID']) > -1) {
        this._variables[i]._in_group = true;
      } else {
        this._variables[i]._in_group = false;
      }
    }

  }

  getVariableGroupsVars() {
    this.variableGroupsVars = [];
    // loop though all the variables in the varaible groups and create a complete list
    for (let i = 0; i < this.variableGroups.length; i++) {
      const obj = this.variableGroups[i];
      const vars = obj.varGrp['@var'].split(' ');
      for (let j = 0; j < vars.length; j++) {
        if (this.variableGroupsVars.indexOf(vars[j]) === -1) {
          this.variableGroupsVars.push(vars[j]);
        }
      }
    }
  }

  sortByOrder() {
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sort.sort({ id: '_order', start: 'asc', disableClear: false });
  }





}
