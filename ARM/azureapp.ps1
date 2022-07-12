using namespace System
using namespace System.Uint64

$resourceGroupName = "[REPLACE_WITH_YOUR_RG_NAME]"
$deploymentObjectId = "[REPLACE_WITH_YOUR_OBJECTID]" # user or service principal object id

try {
  if ($resourceGroupName -eq "[REPLACE_WITH_YOUR_RG_NAME]") {
    $message = "Add your resource group name to the resourceGroupName variable before executing the script."
    throw $message
  }
  if ($deploymentObjectId -eq "[REPLACE_WITH_YOUR_OBJECTID]") {
    $message = "Add your deployment object id to the deploymentObjectId variable before executing the script."
    throw $message
  }
  ### Supporting functions
  # Create unique string based on resource group id (arm template function uniqueString equivalent)
  function Get-UniqueString {
    param(
      [Parameter(
        Mandatory = $true,
        ValueFromPipeline = $true)]
      [string]$InputStringValue
    )

    $Global:encodeLetters = "abcdefghijklmnopqrstuvwxyz234567"
    $uniquestring = GenerateUniqueString -InputString $InputStringValue
    return $uniqueString
  }

  function scramble {
    param (
      [uint32] $value,
      [int] $count
    )
    return ($value -shl $count) -bor ($value -shr 32 - $count)
  }

  function Base32Encode {
    param (
      [uint64] $longVal
    )
    $strOutput = ""
    for ($i = 0; $i -lt 13; $i++) {
      $charIdx = [int]($longVal -shr 59)
      $charAddition = $encodeLetters[$charIdx]
      $strOutput = $strOutput + $charAddition
      $longVal = $longVal -shl 5;

    }
    return $strOutput
  }

  function Base32Decode {
    param (
      [string] $encodedString
    )
    $bigInteger = [Numerics.BigInteger]::Zero
    for ($i = 0; $i -lt $encodedString.Length; $i++) {
      $char = $encodedString[$i]
      $ltrIdx = $encodeLetters.IndexOf($char)
      $bigInteger = ($bigInteger -shl 5) -bor $ltrIdx
    }

    return $bigInteger / 2
  }

  function uncheckedUInt32Multiply {
    param (
      [long] $nbrOne,
      [long] $nbrTwo
    )

    if ($nbrOne -lt 0) { $nbrOnePos = [uint32]::MaxValue - (-$nbrOne) + 1 } else { $nbrOnePos = $nbrOne }
    if ($nbrTwo -lt 0) { $nbrTwoPos = [uint32]::MaxValue - (-$nbrTwo) + 1 } else { $nbrTwoPos = $nbrTwo }

    $uintMaxVal = [uint32]::MaxValue

    $longMultiplyResult = ([uint64]$nbrOnePos * [uint64]$nbrTwoPos)

    $remainder = $longMultiplyResult % $uintMaxVal
    $totalDevisions = ($longMultiplyResult - $remainder) / $uintMaxVal

    $result = $remainder - $totalDevisions
      
    if ($result -lt 0) {
      return ($uintMaxVal - (-$result)) + 1
    }
    return $result
  }

  function uncheckedUInt32Addition {
    param (
      [uint32] $nbrOne,
      [uint32] $nbrTwo
    )

    if ($nbrOne -lt 0) { $nbrOnePos = [uint32]::MaxValue - (-$nbrOne) + 1 } else { $nbrOnePos = $nbrOne }
    if ($nbrTwo -lt 0) { $nbrTwoPos = [uint32]::MaxValue - (-$nbrTwo) + 1 } else { $nbrTwoPos = $nbrTwo }

    $uintMaxVal = [uint32]::MaxValue

    $longAdditionResult = ($nbrOnePos + $nbrTwoPos)
    $remainder = $longAdditionResult % $uintMaxVal
    $totalLoops = ($longAdditionResult - $remainder) / $uintMaxVal
    $result = [System.Math]::Abs($remainder - $totalLoops)

    return $result
  }
  function GenerateUniqueString {
    param(
      [Parameter(Mandatory = $true)]
      [string]$InputString
    )
          
    [uint32]$seed = 0
    [uint32[]] $dataArray = [System.Text.Encoding]::UTF8.GetBytes($InputString)

    [int] $num = $dataArray.Length
    [uint32] $num2 = $seed
    [uint32] $num3 = $seed

    $index = 0

    for ($index = 0; $index + 7 -lt $num; $index += 8) {
      [uint32] $num4 = [uint32]($dataArray[$index] -bor ($dataArray[$index + 1] -shl 8) -bor ($dataArray[$index + 2] -shl 16) -bor ($dataArray[$index + 3] -shl 24))
      [uint32] $num5 = [uint32] ($dataArray[$index + 4] -bor ($dataArray[$index + 5] -shl 8) -bor ($dataArray[$index + 6] -shl 16) -bor ($dataArray[$index + 7] -shl 24))
      $num4 = uncheckedUInt32Multiply $num4 597399067
      $num4 = scramble -value $num4 -count 15
      $num4 = uncheckedUInt32Multiply $num4 2869860233
      $num2 = $num2 -bxor $num4
      $num2 = scramble -value $num2 -count 19
      $num2 = uncheckedUInt32Addition $num2 $num3
      $num2 = uncheckedUInt32Addition (uncheckedUInt32Multiply $num2 5) 1444728091
      $num5 = uncheckedUInt32Multiply $num5 2869860233
      $num5 = scramble -value $num5 -count 17
      $num5 = uncheckedUInt32Multiply $num5 597399067
      $num3 = $num3 -bxor $num5
      $num3 = scramble -value $num3 -count 13
      $num3 = uncheckedUInt32Addition $num3 $num2
      $num3 = uncheckedUInt32Addition (uncheckedUInt32Multiply $num3 5) 197830471
    }

    $num6 = [int]($num - $index)
    if ($num6 -gt 0) {

      $elseVal = switch ($num6) {
        2 { 
          [uint32]($dataArray[$index] -bor ($dataArray[$index + 1] -shl 8)) 
        } 
        3 { 
          [uint32]($dataArray[$index] -bor ($dataArray[$index + 1] -shl 8) -bor ($dataArray[$index + 2] -shl 16)) 
        }
        default { 
          $dataArray[$index] 
        }
      }
          
      if ([uint32]($num6 -ge 4)) { 
        $num7 = ([uint32]($dataArray[$index] -bor ($dataArray[$index + 1] -shl 8) -bor ($dataArray[$index + 2] -shl 16) -bor ($dataArray[$index + 3] -shl 24))
        )
      }
      else {
        $num7 = $elseVal 
      }
      $num7 = uncheckedUInt32Multiply $num7 597399067
      $num7 = scramble -value $num7 -count 15
      $num7 = uncheckedUInt32Multiply $num7 2869860233
      $num2 = $num2 -bxor $num7
      if ($num6 -gt 4) {
        $value = switch ($num6) {
          6 { 
            uncheckedUInt32Multiply ($dataArray[$index + 4] -bor ($dataArray[$index + 5] -shl 8)) -1425107063
          } 
          7 { 
            uncheckedUInt32Multiply ($dataArray[$index + 4] -bor ($dataArray[$index + 5] -shl 8) -bor ($dataArray[$index + 6] -shl 16)) -1425107063
          } 
          default { 
            uncheckedUInt32Multiply ($dataArray[$index + 4]) -1425107063
          } 
        }
        $value = scramble -value $value -count 17
        $value = uncheckedUInt32Multiply $value 597399067
        $num3 = $num3 -bxor $value
      }
    }

    $num2 = $num2 -bxor [uint32]$num
    $num3 = $num3 -bxor [uint32]$num
    $num2 = uncheckedUInt32Addition $num2 $num3
    $num3 = uncheckedUInt32Addition $num3 $num2
    $num2 = $num2 -bxor $num2 -shr 16
    $num2 = uncheckedUInt32Multiply $num2 2246822507
    $num2 = $num2 -bxor $num2 -shr 13
    $num2 = uncheckedUInt32Multiply $num2 3266489909
    $num2 = $num2 -bxor $num2 -shr 16
    $num3 = $num3 -bxor $num3 -shr 16
    $num3 = uncheckedUInt32Multiply $num3 2246822507
    $num3 = $num3 -bxor $num3 -shr 13
    $num3 = uncheckedUInt32Multiply $num3 3266489909
    $num3 = $num3 -bxor $num3 -shr 16
    $num2 = uncheckedUInt32Addition $num2 $num3
    $num3 = uncheckedUInt32Addition $num3 $num2

    $final = ([uint64]$num3 -shl 32) -bor $num2
    $uniqueString = Base32Encode $final
    return $uniqueString
  }

  # Create app role object
  Function CreateAppRole([string] $Name, [string] $Description) {
    $appRole = New-Object Microsoft.Azure.PowerShell.Cmdlets.Resources.MSGraph.Models.ApiV10.MicrosoftGraphAppRole
    $appRole.AllowedMemberType = @('User', 'Application')
    $appRole.DisplayName = $Name
    $appRole.Id = New-Guid
    $appRole.IsEnabled = $true
    $appRole.Description = $Description
    $appRole.Value = $Name;

    return $appRole
  }

  #crete web app object
  Function CreateWebApp([string] $HomePageUrl, [string] $RedirectUri) {
    $webApp = New-Object Microsoft.Azure.PowerShell.Cmdlets.Resources.MSGraph.Models.ApiV10.MicrosoftGraphWebApplication
    $webApp.HomePageUrl = $HomePageUrl
    $webApp.ImplicitGrantSetting = New-Object Microsoft.Azure.PowerShell.Cmdlets.Resources.MSGraph.Models.ApiV10.MicrosoftGraphImplicitGrantSettings
    $webapp.ImplicitGrantSetting.EnableAccessTokenIssuance = $false
    $webApp.ImplicitGrantSetting.EnableIdTokenIssuance = $true
    $webApp.LogoutUrl = ""
    $webApp.RedirectUri = $RedirectUri

    return $webApp
  }

  #create api app object
  Function CreateApiApp([string] $ResourceName) {
    $apiApp = New-Object Microsoft.Azure.PowerShell.Cmdlets.Resources.MSGraph.Models.ApiV10.MicrosoftGraphApiApplication
    $apiApp.AcceptMappedClaim = $null
    $apiApp.KnownClientApplication = @()
    $apiApp.PreAuthorizedApplication = @()
    $apiApp.RequestedAccessTokenVersion = $null
    [Microsoft.Azure.PowerShell.Cmdlets.Resources.MSGraph.Models.ApiV10.MicrosoftGraphPermissionScope]$Oauth2PermissionScope = @{
      AdminConsentDescription = "Allow the application to access $ResourceName on behalf of the signed-in user."
      AdminConsentDisplayName = "Access $ResourceName"
      Id                      = New-Guid
      IsEnabled               = $true
      Type                    = "User"
      UserConsentDescription  = "Allow the application to access $ResourceName on your behalf."
      UserConsentDisplayName  = "Access $ResourceName"
      Value                   = "user_impersonation"
    }
    $apiApp.Oauth2PermissionScope = $Oauth2PermissionScope
    
    return $apiApp
  }

  # Test if string is guid
  function Test-IsGuid {
    [OutputType([bool])]
    param
    (
      [Parameter(Mandatory = $true)]
      [string]$StringGuid
    )
 
    $ObjectGuid = [System.Guid]::empty
    return [System.Guid]::TryParse($StringGuid, [System.Management.Automation.PSReference]$ObjectGuid)
  }

  ### Logic
  # Create app reg for key vault manager
  $rgId = (Get-AzResourceGroup -Name $resourceGroupName).ResourceId
  $rgUniqueString = Get-UniqueString $rgId
  $funcName = "func-kvmgr-" + $rgUniqueString
  $appName = "keyvaultmanager-" + $rgUniqueString
  $appDescription = "Key vault manager"
  $appUri = "https://" + $funcName + ".azurewebsites.net"
  $appReplyUrl = $appUri + "/.auth/login/aad/callback"
  $web = CreateWebApp -HomePageUrl $appUri -RedirectUri $appReplyUrl
  $api = CreateApiApp -ResourceName $funcName

  $app = Get-AzAdApplication -DisplayName $appName

  # Test if duplicate app regs
  if ($app -is [system.array]) {
    Throw "Found duplicate application registrations for Key Vault Manager."
  }
  # Test if new or existing app reg
  if (!$app) {
    Write-Host "Creating the Key Vault Manager application registration."
    $app = New-AzADApplication -DisplayName $appName -Description $appDescription -AvailableToOtherTenants $False -Web $web -Api $api
  }
  else {
    Write-Host "Updating existing Key Vault Manager application registration."
    $api = $app.Api
    Update-AzADApplication -ApplicationId $app.AppId -Description $appDescription -AvailableToOtherTenants $False -Web $web -Api $api
  }

  # Adding identifier uri and resource access
  $appIdentifierUri = "api://" + $app.AppId
  $requiredResourceAccess = @{
    ResourceAppId  = "00000003-0000-0000-c000-000000000000"; # ms graph
    ResourceAccess = @(
      @{
        Id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"; #user.read
        Type = "Scope"
      }
    )
  }

  # Adding roles
  $appRole = $app.AppRole
  $kvmgrReaderRoleName = "KeyVaultManagerReader"
  $kvmgrReaderRoleDescription = "Key vault manager readers can read from managed key vaults"
  if ($appRole -match $kvmgrReaderRoleName) {
    Write-Host "Key vault reader role already defined."
  }
  else {
    Write-Host "Adding key vault reader role."
    $readRole = CreateAppRole -Name $kvmgrReaderRoleName -Description $kvmgrReaderRoleDescription
    $appRole += $readRole
  }

  $kvmgrWriterRoleName = "KeyVaultManagerWriter"
  $kvmgrWriterRoleDescription = "Key vault manager writers can write to managed key vaults"
  if ($appRole -match $kvmgrWriterRoleName) {
    Write-Host "Key vault writer role already defined."
  }
  else {
    Write-Host "Adding key vault writer role."
    $writeRole = CreateAppRole -Name $kvmgrWriterRoleName -Description $kvmgrWriterRoleDescription
    $appRole += $writeRole
  }
  
  $eventGridRoleName = "AzureEventGridSecureWebhookSubscriber"
  $eventGridRoleDescription = "Azure Event Grid Role"
  if ($appRole -match $eventGridRoleName) {
    Write-Host "Key vault event subscription role already defined."
  }
  else {
    Write-Host "Adding key vault event subscription role."
    $eventSubscriptionRole = CreateAppRole -Name $eventGridRoleName -Description $eventGridRoleDescription
    $appRole += $eventSubscriptionRole
  }

  Update-AzADApplication -ApplicationId $app.AppId -IdentifierUri $appIdentifierUri -RequiredResourceAccess $requiredResourceAccess -AppRole $appRole

  # Create app secret
  $existingCreds = Get-AzADAppCredential -ApplicationId $app.AppId
  if ($existingCreds -match $funcName) {
    $message = "Found existing creds. Check hint or remove and recreate."
    Write-Host $message
    $secret = [pscustomobject]@{
      SecretText = $message
    }
  }
  else {
    Write-Host "Creating application secret."
    $StartDate = get-date
    $EndDate = $startDate.AddYears(1)
    $creds = @{
      DisplayName   = $funcName;
      StartDateTime = $StartDate;
      EndDateTime   = $EndDate
    }
    $secret = New-AzADAppCredential -ApplicationId $app.AppId -PasswordCredentials $creds
  }

  # create sp for key vault manager
  $kvmgrSP = Get-AzADServicePrincipal -ApplicationId $app.AppId
  if ($kvmgrSP -match $app.DisplayName) {
    Write-Host "Key Vault Manager application is already defined."
  }
  else {
    Write-Host "Creating Key Vault Manager Application."
    $tags = @()
    $tags += "HideApp"
    $tags += "AppServiceIntegratedApp"
    $tags += "WindowsAzureActiveDirectoryIntegratedApp"
    $kvmgrSP = New-AzADServicePrincipal -AppId $app.AppId -Description $appDescription -AppRoleAssignmentRequired -Tag $tags
    # set owner
    $signedInUser = Get-AzADUser -SignedIn
    # dependant on old azure ad moodule
    Connect-AzureAd
    Add-AzureADServicePrincipalOwner -ObjectId $kvmgrSP.Id -RefObjectId $signedInUser.Id
  }

  # create sp for event grid
  $eventGridAppId = "4962773b-9cdb-44cf-a8bf-237846a00ab7" # app id of ms event grid
  $eventGridSP = Get-AzADServicePrincipal -ApplicationId $eventGridAppId
  if ($eventGridSP -match "Microsoft.EventGrid") {
    Write-Host "Azure Event Grid Application is already defined."
  }
  else {
    Write-Host "Creating Azure Event Grid Application"
    $eventGridSP = New-AzADServicePrincipal -AppId $eventGridAppId
  }

  # role assignment for event grid
  Write-Host "Creating role assignment for Azure Event Grid."
  $eventGridAppRole = $app.AppRole | Where-Object -Property "DisplayName" -eq -Value $eventGridRoleName
  # dependant on old azure ad moodule
  Connect-AzureAd
  try {
    New-AzureADServiceAppRoleAssignment -Id $eventGridAppRole.Id -ResourceId $kvmgrSP.Id -ObjectId $kvmgrSP.Id -PrincipalId $eventGridSP.Id -ErrorAction SilentlyContinue
  }
  catch {
    $message = (Get-Error).Exception.ErrorContent.Message.Value
    Write-Host $message
  }

  # role assignment for deployment (sp or user)
  # dependant on old azure ad moodule
  if (Test-IsGuid $deploymentObjectId) {
    $deployUser = Get-AzADUser -ObjectId $deploymentObjectId -ErrorAction SilentlyContinue
    $deploySP = Get-AzADServicePrincipal -ObjectId $deploymentObjectId -ErrorAction SilentlyContinue
    if ($deployUser) {
      Write-Host "Creating role assignment for deployment user."
      try {
        New-AzureADServiceAppRoleAssignment -Id $eventGridAppRole.Id -ResourceId $kvmgrSP.Id -ObjectId $kvmgrSP.Id -PrincipalId $deployUser.Id -ErrorAction SilentlyContinue
      }
      catch {
        $message = (Get-Error).Exception.ErrorContent.Message.Value
        Write-Host $message
      }
      
    }
    if ($deploySP) {
      Write-Host "Creating role assignment for deployment service principal."
      try {
        New-AzureADServiceAppRoleAssignment -Id $eventGridAppRole.Id -ResourceId $kvmgrSP.Id -ObjectId $kvmgrSP.Id -PrincipalId $deploySP.Id -ErrorAction SilentlyContinue
      }
      catch {
        $message = (Get-Error).Exception.ErrorContent.Message.Value
        Write-Host $message
      }
      
    }    
  }
  else {
    Write-Host "Supplied deployment ObjectId is not a guid."
  }

  # Print output of key information
  Write-Host "`n>> Key Vault Manager Application Id: $($app.AppId)"
  Write-Host ">> Key Vault Manager Object Id: $($app.Id)"
  Write-Host ">> Key Vault Manager Secret: $($secret.SecretText)"
}
catch {
  Write-Host ">> Exception:"
  Write-Host $_
  Write-Host ">> StackTrace:"
  Write-Host $_.ScriptStackTrace
}