<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel' || trim($slot) === 'BarangayPGT')
<span style="font-size: 1.5rem; font-weight: bold; color: #2563eb;">BarangayPGT</span>
@else
{{ $slot }}
@endif
</a>
</td>
</tr>
