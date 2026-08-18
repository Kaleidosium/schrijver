<script lang="ts">
	interface Props {
		readonly saveLabel: string;
		readonly stats: string;
	}

	const { saveLabel, stats }: Props = $props();
</script>

<footer
	class="flex min-h-xl flex-wrap items-center justify-between gap-x-s gap-y-xs border-t border-rule bg-page/92 px-2xs py-xs font-sans text-[0.82rem] text-muted transition-opacity duration-150 group-data-[focused=true]:opacity-35 group-data-[focused=true]:hover:opacity-100 min-[42.01rem]:px-[max(var(--spacing-s),calc((100vw-var(--shell-max))/2+var(--spacing-s)))]"
	aria-label="Draft status"
>
	<span>{stats}</span>
	<span>{saveLabel}</span>
</footer>
