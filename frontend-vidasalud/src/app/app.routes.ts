import { Routes } from '@angular/router';
import { Login } from './views/login/login';
import { Atenciones } from './views/atenciones/atenciones';
import { CatalogoPrestaciones } from './views/catalogo-prestaciones/catalogo-prestaciones';
import { Reporteria } from './views/reporteria/reporteria';
import { Dashboard } from './views/dashboard/dashboard';
import { Auditoria } from './views/auditoria/auditoria';

export const routes: Routes = [{path: 'login', component: Login},
                               {path: 'atenciones', component: Atenciones},
                               {path: 'dashboard', component: Dashboard},
                               {path: 'reporteria', component: Reporteria},
                               {path: 'auditoria', component: Auditoria},
                               {path: 'catalogo-prestaciones', component: CatalogoPrestaciones}
];
