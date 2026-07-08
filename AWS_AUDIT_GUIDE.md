# AWS Resource Audit — Check What's Running & Costing You

> Use this guide to scan your AWS account for **all active resources** and identify anything left running that could incur charges.

---

## Quick One-Liner (All Services)

Run this single command to check **everything at once**:

```powershell
Write-Host "=== RDS ==="; aws rds describe-db-instances --query "DBInstances[].[DBInstanceIdentifier,DBInstanceStatus,DBInstanceClass]" --output table
Write-Host "`n=== EC2 ==="; aws ec2 describe-instances --query "Reservations[].Instances[].[InstanceId,State.Name,InstanceType]" --output table
Write-Host "`n=== EKS Cluster ==="; aws eks list-clusters --query "clusters" --output table
Write-Host "`n=== EIP (Elastic IPs) ==="; aws ec2 describe-addresses --query "Addresses[].[AllocationId,PublicIp,InstanceId]" --output table
Write-Host "`n=== NAT Gateways ==="; aws ec2 describe-nat-gateways --query "NatGateways[].[NatGatewayId,State]" --output table
Write-Host "`n=== Load Balancers (ALB/NLB) ==="; aws elbv2 describe-load-balancers --query "LoadBalancers[].[LoadBalancerName,State.Code,DNSName]" --output table
Write-Host "`n=== Classic Load Balancers ==="; aws elb describe-load-balancers --query "LoadBalancerDescriptions[].[LoadBalancerName]" --output table
Write-Host "`n=== EC2 Security Groups ==="; aws ec2 describe-security-groups --query "SecurityGroups[].[GroupId,GroupName,Description]" --output table
Write-Host "`n=== Elastic Container Registry (ECR) ==="; aws ecr describe-repositories --query "repositories[].[repositoryName,repositoryUri]" --output table
Write-Host "`n=== CloudFormation Stacks ==="; aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE ROLLBACK_COMPLETE DELETE_FAILED --query "StackSummaries[].[StackName,StackStatus]" --output table
Write-Host "`n=== IAM Roles (project-specific) ==="; aws iam list-roles --query "Roles[?contains(RoleName,'inventory-mgmt') || contains(RoleName,'eks')].[RoleName,CreateDate]" --output table
```

### What the output tells you

| Service | Empty `[]` means | Has data means |
|---|---|---|
| RDS | ✅ No databases | ❌ **You're being charged ~$50-70/mo** |
| EC2 | ✅ No instances running | ❌ **You're being charged per instance** |
| EKS Cluster | ✅ No clusters | ❌ **~$73/mo for control plane** |
| EIP | ✅ No Elastic IPs | ❌ **~$3.60/mo per unused EIP** |
| NAT Gateway | ✅ No NAT Gateways | ❌ **~$32/mo + data transfer** |
| Load Balancers | ✅ No Load Balancers | ❌ **~$20-25/mo each** |
| ECR repos | ✅ No repositories | ❌ Minimal cost (storage only) |
| CloudFormation | ✅ No stacks | ⚠️ May hold resources |

---

## Individual Checks (Detailed)

### 1. RDS (Relational Database Service)

```powershell
# List all DB instances
aws rds describe-db-instances --query "DBInstances[].[DBInstanceIdentifier,DBInstanceStatus,DBInstanceClass,Engine]" --output table
```

**Cost:** `db.t3.medium` SQL Server ≈ **$50-70/month**

**Check specific instance:**
```powershell
aws rds describe-db-instances --db-instance-identifier inventory-mgmt-sqlserver
# Returns error "not found" = ✅ Deleted
```

---

### 2. EC2 Instances

```powershell
# List ALL instances (running or stopped)
aws ec2 describe-instances --query "Reservations[].Instances[].[InstanceId,State.Name,InstanceType,LaunchTime]" --output table
```

**Cost:** `t3.medium` ≈ **$30/month each** (running 24/7)

---

### 3. EKS Cluster

```powershell
# List clusters
aws eks list-clusters --output table

# Check specific cluster
aws eks describe-cluster --name inventory-mgmt-cluster
```

**Cost:** EKS control plane ≈ **$73/month**

---

### 4. Elastic IPs (EIP)

```powershell
# List all EIPs
aws ec2 describe-addresses --query "Addresses[].[AllocationId,PublicIp,AssociationId]" --output table
```

**Cost if `AssociationId` is `null`** = **$3.60/month** (unused EIP)

---

### 5. NAT Gateway

```powershell
aws ec2 describe-nat-gateways --query "NatGateways[].[NatGatewayId,State,SubnetId]" --output table
```

**Cost:** ≈ **$32/month** + data processing charges

---

### 6. Load Balancers

```powershell
# Modern ALB/NLB
aws elbv2 describe-load-balancers --query "LoadBalancers[].[LoadBalancerName,State.Code,DNSName]" --output table

# Classic ELB
aws elb describe-load-balancers --query "LoadBalancerDescriptions[].[LoadBalancerName]" --output table
```

**Cost:** ALB ≈ **$20-25/month** + LCU charges

---

### 7. VPC & Networking

```powershell
# List all VPCs (check CIDR block to identify yours)
aws ec2 describe-vpcs --query "Vpcs[].[VpcId,CidrBlock,IsDefault]" --output table

# List all Subnets
aws ec2 describe-subnets --query "Subnets[].[SubnetId,CidrBlock,VpcId]" --output table

# List all Internet Gateways
aws ec2 describe-internet-gateways --query "InternetGateways[].[InternetGatewayId,Attachments[0].VpcId]" --output table

# List all Security Groups
aws ec2 describe-security-groups --query "SecurityGroups[].[GroupId,GroupName,VpcId]" --output table
```

Our project's VPC used **`10.0.0.0/16`** CIDR range.
The **default VPC** uses **`172.31.x.x`** range and has **no charge**.

---

### 8. ECR (Elastic Container Registry)

```powershell
aws ecr describe-repositories --query "repositories[].[repositoryName,repositoryUri,imageCount]" --output table
```

**Cost:** Minimal — storage only (~$0.10/GB/month)

---

### 9. CloudFormation

```powershell
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE ROLLBACK_COMPLETE DELETE_FAILED --query "StackSummaries[].[StackName,StackStatus]" --output table
```

EKS sometimes creates CloudFormation stacks for node groups. If they exist, they may hold resources.

---

### 10. IAM Roles

```powershell
aws iam list-roles --query "Roles[?contains(RoleName,'inventory-mgmt') || contains(RoleName,'eks')].[RoleName,CreateDate]" --output table
```

**Cost:** IAM roles are **free**, but may block resource cleanup.

---

## What is the Default VPC?

Every AWS account gets a **default VPC** automatically in each region. It's **free** and unrelated to our project.

| Property | Default VPC | Our Project VPC |
|---|---|---|
| CIDR | `172.31.0.0/16` | `10.0.0.0/16` |
| Subnets | `172.31.x.x` | `10.0.x.x` |
| Created by | AWS automatically | Terraform |
| Charge | **Free** | N/A (deleted) |

**If you only see `172.31.x.x` subnets, one default security group, and one default IGW → you're clean.**

---

## Cost Summary Table

| Service | Monthly cost (if active) | How to check |
|---|---|---|
| RDS SQL Server (db.t3.medium) | ~$50-70 | `aws rds describe-db-instances` |
| EKS Control Plane | ~$73 | `aws eks list-clusters` |
| EC2 Worker Nodes (t3.medium × 2) | ~$60 | `aws ec2 describe-instances` |
| NAT Gateway | ~$32 | `aws ec2 describe-nat-gateways` |
| EIP (unused) | ~$3.60 | `aws ec2 describe-addresses` |
| Load Balancer | ~$20-25 | `aws elbv2 describe-load-balancers` |
| **Total if ALL running** | **~$240+/mo** | — |

---

## Quick Reference — When to Use This

| Situation | Command to run |
|---|---|
| Before `terraform apply` — check nothing old is lingering | Run the [Quick One-Liner](#quick-one-liner-all-services) |
| After `terraform destroy` — verify clean slate | Run the [Quick One-Liner](#quick-one-liner-all-services) |
| You got an AWS bill and want to know what's running | Run the [Quick One-Liner](#quick-one-liner-all-services) |
| Monthly cleanup check | Run the [Quick One-Liner](#quick-one-liner-all-services) + check ECR |

---

> **Rule of thumb:** If the Quick One-Liner returns only default VPC resources (subnets in `172.31.x.x`, `default` security group) → ✅ You have **zero charges** from our project.
