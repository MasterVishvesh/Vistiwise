# Hosting and install

Build and test on this computer. AWS is the host after the paid plan is active. The AWS Free plan is a six-month credit trial, and it deletes the account about 90 days after that trial ends, so it is not the place for the doctors' records.

## What runs where

| Piece | Now, on this computer | Later, on the paid AWS plan |
| --- | --- | --- |
| Screens | Vite dev server, then a static build | Amazon S3 and CloudFront |
| API | Node process on port 3001 | Container on Amazon ECS (Fargate), image in Amazon ECR, address on an Application Load Balancer |
| Database | PostgreSQL 16 in Docker, port 5432 | Amazon RDS for PostgreSQL, same schema |
| Secrets | `apps/api/.env` on this machine | AWS Secrets Manager |
| Name and lock icon | `localhost` | Amazon Route 53 and a free certificate from AWS Certificate Manager |
| Login sessions | Rows in the local database | Rows in RDS |

The API container and the Prisma migrations are the same artifact in both places. Local testing is a dress rehearsal for RDS, not a separate database engine.

## Why the paid plan is the AWS step

A new AWS account can start on the Free plan with $100 in credits, and can earn up to $100 more. That plan ends six months after signup or when the credits run out, whichever comes first. A PostgreSQL instance running all month spends those credits. When the Free plan ends, the account must move to paid within about 90 days or AWS deletes what is in it.

The paid plan is the point at which RDS, ECS, and S3 become the doctors' shared copy. Until that bill is accepted, the working system is the one on this computer.

AWS App Runner is closed to new accounts from 30 April 2026. ECS Express Mode is the replacement. It runs the same container and adds a load balancer. Do not plan a new App Runner service.

## What a phone uses

The phone app is this website, installed with **Add to Home Screen**. It is not a second program. The manifest is already in the web app.

These stay on all day, in Asia Pacific (Mumbai), so the icon opens whenever the doctor picks up the phone:

- **Amazon RDS for PostgreSQL** holds patients, visits, fees, and login sessions. Size `db.t4g.micro`, 20 GB gp3. Single zone is enough for one clinic.
- **Amazon ECS on Fargate** runs one small API container (0.25 vCPU, 0.5 GB).
- **Application Load Balancer** is the API's stable HTTPS address. ECS Express Mode creates it. It is a large part of the bill even when nobody is using the app.
- **Amazon ECR** stores the API image.
- **Amazon S3 and CloudFront** serve the screens. **AWS Certificate Manager** provides the lock icon at no charge.
- **Amazon Route 53** points the domain at CloudFront and the load balancer.
- **AWS Secrets Manager** holds the database password.
- **Amazon CloudWatch** keeps a short log.
- **Amazon VPC** connects the API to the database. Do not add a NAT gateway. A NAT gateway costs about as much as the database, every day, and this app does not need one.
- **Amazon SES** is only for password-reset email, if that mail is sent from AWS. A few messages a month are a few cents.

Leave off Multi-AZ, a web application firewall, and a second API copy until more than one clinic is on the system. Those each add a daily charge.

For one doctor, left on 24 hours in Mumbai, this list is about **$1.56 a day before tax**, about **₹175 a day with 18% GST**, and about **₹5,250 for 30 days** at ₹94.94 per dollar. Prices move. Check the AWS Pricing Calculator for Mumbai before creating anything.

## How a doctor gets the app

The interface is one web app.

- On a phone, the browser's **Add to Home Screen** installs an icon.
- On a laptop, Chrome or Edge **Install** opens it in its own window.

Before the AWS deploy, a service worker and an on-device copy of the records are added, so an installed icon still opens if ECS or RDS is down. A Capacitor wrapper can turn that same interface into an Android, iPhone, or Windows package after the screens are in daily use. The wrapper does not add a second set of screens.

| Install | When | Cost |
| --- | --- | --- |
| Home screen and laptop window | With the local app, then again from the CloudFront address | Free |
| Android package | After daily use | A direct install file is free to share. Google Play charges a one-time developer fee. |
| iPhone store app | Only if a home-screen install is not enough | Apple's developer program is paid yearly |
| Windows installer | Only if the laptop install-from-browser is not enough | No store fee if the file is shared directly |

## Backup

**Download backup** writes a JSON file from the database the app is using. **Restore backup** replaces that doctor's patients from the file. Copy the file before any move from the local database to RDS.
