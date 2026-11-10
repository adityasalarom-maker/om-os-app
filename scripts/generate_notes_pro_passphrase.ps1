[CmdletBinding(SupportsShouldProcess = $true)]
param()

$ErrorActionPreference = 'Stop'
$entropyBytes = 32
$randomBytes = New-Object byte[] $entropyBytes
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()

try {
    $rng.GetBytes($randomBytes)
    $passphrase = [Convert]::ToBase64String($randomBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}
finally {
    $rng.Dispose()
    [Array]::Clear($randomBytes, 0, $randomBytes.Length)
}

if ($PSCmdlet.ShouldProcess('Windows clipboard', 'Copy a newly generated Notes Studio Pro passphrase')) {
    Set-Clipboard -Value $passphrase
    Write-Output "Generated a $($passphrase.Length)-character passphrase from 256 bits of cryptographic randomness and copied it to the clipboard. The script does not write it to disk or print it."
}

$passphrase = $null
