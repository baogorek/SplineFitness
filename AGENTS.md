# SplineFitness

## Verification

- Run `npm run lint`.
- Run `npm run build`.

## Deployment

- Production hosting is Vercel.
- The production URL is https://splinefitness.com.
- The linked Vercel project is `strength-tracker`.
- Pushing `main` to `origin` automatically triggers a production deployment.
- When explicitly asked to deploy:
  1. Verify lint and build pass.
  2. Commit the task's changes.
  3. Push `main` to `origin`.
  4. Use the Vercel CLI to confirm the resulting production deployment is Ready.
  5. Verify https://splinefitness.com returns HTTP 200.
- Do not run a separate `vercel --prod` deployment unless the Git-triggered deployment fails.
