/* eslint-disable no-console */

import AppComponents from '../AppComponents';
import defineAnalyze from './defineAnalyze';
import allRouteDefinitions from './allRouteDefinitions';
import { attachRoute, RouteDefinition } from './routeSystem';
import defineUnsubscribe from './defineUnsubscribe';

export default function defineRoutes(appComponents: AppComponents) {
  defineAnalyze(appComponents);
  defineUnsubscribe(appComponents);

  for (const [path, routeDefinition] of Object.entries(allRouteDefinitions)) {
    attachRoute(
      path as keyof typeof allRouteDefinitions,
      appComponents,
      routeDefinition as RouteDefinition<any>,
    );
  }
}
