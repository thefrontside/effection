import { initPackageContext, PackageConfig } from "../../hooks/use-package.tsx";

interface PackageIndexItemProps {
  config: PackageConfig;
}

export function PackageIndexItem(props: PackageIndexItemProps) {
  return function* () {
    const pkg = yield* initPackageContext(props.config);

    return (
      <li class="px-0">
        <h3>
          <a href={`/${pkg.workspace}`}>{pkg.workspace}</a>
        </h3>
        <p>
          {yield* pkg.description()}
        </p>
      </li>
    );
  };
}
